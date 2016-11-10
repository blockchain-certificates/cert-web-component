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
    // 1. compute local hash
    //    for v1.2 certs, this involves getting it json-ld normalized
    // 2. fetch remote hash
    // 3. compare hashes
    // 4. Paths diverge.

    // 1.1 certificates
    // 4. check issuer signature
    // 5. check revoked status
    // 6. Done!

    // 1.2 certificates
    // 4. check merkle root
    // 5. check receipt
    // 6. check issuer signature. See 1.1 #4

  }
  _computeLocalHash() {
    this.statusCallback(Status.computingLocalHash)

    if (this._validationState.certificateVersion === "1.1") {
      this._validationState.localHash = sha256(this.certificateString)
      this._fetchRemoteHash()
    } else {
      jsonld.normalize(this._validationState.certificate.document, {
        algorithm: 'URDNA2015',
        format: 'application/nquads'
      }, (err, normalized) => {
        if (!!err) {
          this._failed(`Failed JSON-LD normalization with error: ${err}`);
          return;
        } else {
          const dataStream = this._toData(normalized);
          this._validationState.localHash = sha256(dataStream);
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
      transactionID = window.prompt("What's the transaction ID for this certificate?") || ""
      transactionID.trim()
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
      for (let index in proof) {
        const node = proof[index]
        if (typeof node.left !== "undefined") {
          let appendedBuffer = `${node.left}${proofHash}`;
          proofHash = sha256(appendedBuffer)
        } else if (typeof node.right !== "undefined") {
          let appendedBuffer = `${proofHash}${node.right}`;
          proofHash = sha256(appendedBuffer)
        } else {
          throw new Error("We should never get here.")
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

    const issuerURL = this._validationState.certificate.issuer.id;
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

        this._validationState.revocationKey = revokeKey

        // TODO: Figure this part out
        let address = "BOOOOOO"
        if (address != issuerKey) {
          this._failed(`Issuer key doesn't match derived address. Address: ${address}, Issuer Key: ${issuerKey}`);
          return;
        }
      } catch (e) {
        this._failed('Unable to parse JSON out of issuer signature data.')
        return;
      }

      this._checkRevokedStatus();
    });
    request.addEventListener('error', (event) => {
      this._failed("Error requesting issuer signature.")
    })
    request.open('GET', issuerURL);
    request.start();
  }
  _checkRevokedStatus() {
    this.statusCallback(Status.checkingRevokedStatus)

    const revokedAddresses = this._validationState.revokedAddresses;
    let revocationKey = this._validationState.revocationKey;
    const isRevokedByIssuer = (-1 != revokedAddresses.findIndex((address) => address === revocationKey))
    if (isRevokedByIssuer) {
      this._failed('This certificate batch has been revoked by the issuer.')
      return;
    }

    revocationKey = this._validationState.certificate.recipient.revocationKey
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
  _toData(string) {
    let utf8 = unescape(encodeURIComponent(string));
    let outString = [];
    for (let i = 0; i < utf8.length; ++i) {
      outString.push(utf8.charCodeAt(i));
      // let letter = string[i];
      // outString += letter.charCodeAt(0).toString(16);
    }
    return outString;
  }
}
