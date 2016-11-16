'use strict';

let Status = {
  computingLocalHash: "computingLocalHash",
  fetchingRemoteHash: "fetchingRemoteHash",
  comparingHashes: "comparingHashes",
  checkingMerkleRoot: "checkingMerkleRoot",
  checkingReceipt: "checkingReceipt",
  checkingIssuerSignature: "checkingIssuerSignature",
  checkingRevokedStatus: "checkingRevokedStatus",
  success: "success",
  failure: "failure",
}

class CertificateValidator {
  constructor(certificateString, statusCallback) {
    this.certificateString = certificateString;
    this.statusCallback = statusCallback;
  }
  validate() {
    this._validationState = {};
    let certificate
    try {
      certificate = JSON.parse(this.certificateString);
      this._validationState.certificate = certificate;
    } catch (e) {
      this._failed("Certificate wasn't valid JSON data.");
      return
    }

    if (typeof certificate.receipt === "undefined") {
      this._validationState.certificateVersion = "1.1"
    } else {
      this._validationState.certificateVersion = "1.2"
    }

    this._computeLocalHash()
  }
  _computeLocalHash() {
    this.statusCallback(Status.computingLocalHash)

    if (this._validationState.certificateVersion === "1.1") {
      // When getting the file over HTTP, we've seen an extra newline be appended. This removes that.
      let correctedData = this.certificateString.slice(0, -1);
      this._validationState.localHash = sha256(correctedData);
      this._fetchRemoteHash();
    } else {
      jsonld.normalize(this._validationState.certificate.document, {
        algorithm: 'URDNA2015',
        format: 'application/nquads'
      }, (err, normalized) => {
        if (!!err) {
          this._failed(`Failed JSON-LD normalization with error: ${err}`);
          return;
        } else {
          this._validationState.localHash = sha256(this._toUTF8Data(normalized));
          this._fetchRemoteHash();
        }
      });
    }
  }
  _fetchRemoteHash() {
    this.statusCallback(Status.fetchingRemoteHash);

    let transactionID;
    try {
      const receipt = this._validationState.certificate.receipt
      transactionID = receipt.anchors[0].sourceId
    } catch (e) {
      transactionID = window.prompt("What's the transaction ID for this certificate?")
      if (transactionID == null) {
        this._failed(`Can't validate this certifiate without a transaction ID to compare against.`);
        return;
      }
      transactionID = transactionID.trim()
    }

    let request = new XMLHttpRequest();
    request.addEventListener('load', (event) => {
      if (event.target.status !== 200) {
        this._failed(`Got ${event.target.status} response when trying to get remote transaction data.`)
        return;
      }
      try {
        const responseData = JSON.parse(event.target.responseText)
        let outputs = responseData.out
        let lastOutput = outputs[outputs.length - 1]
        const opReturnScript = lastOutput.script
        const revokedAddresses = outputs
          .filter((output) => !!output.spent)
          .map((output) => output.addr)

        if (lastOutput.value != 0) {
          this._failed('No output values were 0.')
          return;
        }

        this._validationState.remoteHash = opReturnScript
        this._validationState.revokedAddresses = revokedAddresses
      } catch (e) {
        this._failed('Unable to parse JSON out of remote transaction data.')
        return;
      }

      this._compareHashes();
    });
    request.addEventListener('error', (event) => {
      this._failed("Error requesting remote transaction content.")
    })
    request.open('GET', `https://blockchain.info/rawtx/${transactionID}?cors=true`);
    request.send();
  }
  _compareHashes() {
    this.statusCallback(Status.comparingHashes)
    let compareToHash = ""

    if (this._validationState.certificateVersion === "1.1") {
      const prefix = "6a20"
      let remoteHash = this._validationState.remoteHash
      if (remoteHash.startsWith(prefix)) {
        remoteHash = remoteHash.slice(prefix.length)
      }
      compareToHash = remoteHash
    } else {
      compareToHash = this._validationState.certificate.receipt.targetHash
    }

    if (this._validationState.localHash !== compareToHash) {
      this._failed(`Local hash (${this._validationState.localHash}) does not match remote hash (${compareToHash})`);
      return;
    }

    if (this._validationState.certificateVersion === "1.1") {
      this._checkIssuerSignature()
    } else {
      this._checkMerkleRoot()
    }
  }
  _checkMerkleRoot() {
    this.statusCallback(Status.checkingMerkleRoot)

    let merkleRoot = this._validationState.certificate.receipt.merkleRoot
    let prefixedMerkleRoot = `6a20${merkleRoot}`

    const remoteHash = this._validationState.remoteHash;
    if (prefixedMerkleRoot !== remoteHash) {
      this._failed(`MerkleRoot does nto match remote hash. MerkleRoot:${prefixedMerkleRoot}, hash: ${remoteHash}`)
      return;
    }
    this._checkReceipt()
  }
  _checkReceipt() {
    this.statusCallback(Status.checkingReceipt)

    const receipt = this._validationState.certificate.receipt;
    let proofHash = receipt.targetHash;
    let merkleRoot = receipt.merkleRoot;
    try {
      let proof = receipt.proof;
      if (!!proof) {
        for (let index in proof) {
          const node = proof[index]
          if (typeof node.left !== "undefined") {
            let appendedBuffer = this._toByteArray(`${node.left}${proofHash}`);
            proofHash = sha256(appendedBuffer)
          } else if (typeof node.right !== "undefined") {
            let appendedBuffer = this._toByteArray(`${proofHash}${node.right}`);
            proofHash = sha256(appendedBuffer)
          } else {
            throw new Error("We should never get here.")
          }
        }
      }
    } catch (e) {
      this._failed('The receipt is malformed. There was a problem navigating the merkle tree in the receipt.');
      return;
    }

    if (proofHash !== merkleRoot) {
      this._failed(`Invalid Merkle Receipt. Proof hash: ${proofHash}, Merkle Root: ${merkleRoot}`)
      return;
    }

    this._checkIssuerSignature()
  }
  _checkIssuerSignature() {
    this.statusCallback(Status.checkingIssuerSignature)

    let certificate = this._validationState.certificate.certificate || this._validationState.certificate.document.certificate;
    let issuer = certificate && certificate.issuer;
    let issuerURL = issuer.id;
    let request = new XMLHttpRequest();
    request.addEventListener('load', (event) => {
      if (event.target.status !== 200) {
        this._failed(`Got ${event.target.status} response when trying to get remote transaction data.`)
        return;
      }
      try {
        const responseData = JSON.parse(event.target.responseText);
        const issuerKeys = responseData.issuerKeys || [];
        const revocationKeys = responseData.revocationKeys || [];

        let issuerKey = issuerKeys[0].key;
        let revokeKey = revocationKeys[0].key;

        this._validationState.revocationKey = revokeKey;

        let uid = this._validationState.certificate.document.assertion.uid;
        let signature = this._validationState.certificate.document.signature;
        if (!external.bitcoin.message.verify(issuerKey, signature, uid)) {
          this._failed(`Issuer key doesn't match derived address. Address: ${address}, Issuer Key: ${issuerKey}`);
          return;
        }
      } catch (e) {
        this._failed('Unable to parse JSON out of issuer signature data.');
        return;
      }

      this._checkRevokedStatus();
    });
    request.addEventListener('error', (event) => {
      this._failed("Error requesting issuer signature.")
    })
    request.open('GET', issuerURL);
    request.send();
  }
  _checkRevokedStatus() {
    this.statusCallback(Status.checkingRevokedStatus);

    const revokedAddresses = this._validationState.revokedAddresses;
    let revocationKey = this._validationState.revocationKey;
    const isRevokedByIssuer = (-1 != revokedAddresses.findIndex((address) => address === revocationKey))
    if (isRevokedByIssuer) {
      this._failed('This certificate batch has been revoked by the issuer.')
      return;
    }

    revocationKey = this._validationState.certificate.document.recipient.revocationKey;
    const isRevokedByRecipient = (-1 != revokedAddresses.findIndex((address) => address === revocationKey))
    if (isRevokedByRecipient) {
      this._failed("This recipient's certificate has been revoked.");
      return;
    }

    this._succeed();
  }
  _succeed() {
    this.statusCallback(Status.success)
  }
  _failed(reason) {
    this.statusCallback(Status.failure, reason)
  }
  // Helper functions
  _toUTF8Data(string) {
    var utf8 = [];
    for (var i=0; i < string.length; i++) {
        var charcode = string.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6),
                      0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12),
                      0x80 | ((charcode>>6) & 0x3f),
                      0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i++;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff)<<10)
                      | (string.charCodeAt(i) & 0x3ff));
            utf8.push(0xf0 | (charcode >>18),
                      0x80 | ((charcode>>12) & 0x3f),
                      0x80 | ((charcode>>6) & 0x3f),
                      0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
  }
  _toByteArray(hexString) {
    let outArray = []
    let byteSize = 2
    for (let i = 0; i <hexString.length; i += byteSize) {
      outArray.push(parseInt(hexString.substring(i, i + byteSize), 16));
    }
    return outArray
  }
  _hexFromByteArray(byteArray) {
    let out = ""
    for (let i = 0; i < byteArray.length; ++i) {
      let value = byteArray[i]
      if (value < 16) {
        out += "0" + value.toString(16)
      } else {
        out += value.toString(16)
      }
    }
    return out
  }
}
