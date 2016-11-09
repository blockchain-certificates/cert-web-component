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
      jsonld.normalize(this._validationState.certificate, {
        algorithm: 'URDNA2015',
        format: 'application/nquads'
      }, (err, normalized) => {
        if (!!err) {
          this._failed(`Failed JSON-LD normalization with error: ${err}`)
        } else {
          this._validationState.localHash = sha256(normalized)
          this._fetchRemoteHash()
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
        const opReturnScript = lastOutput.data_hex
        const revokedAddresses = outputs
          .filter((output) => !!output.spent)
          .map((output) => output.addr)

        if (lastOutput.value != 0) {
          this._failed('No output values were 0.')
          return;
        }

        this._validationState.opReturnScript = opReturnScript
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

    if (this._validationState.certificateVersion === "1.1") {
      this._checkIssuerSignature()
    } else {
      this._checkMerkleRoot()
    }
  }
  _checkMerkleRoot() {
    this.statusCallback(Status.checkingMerkleRoot)

    this._checkReceipt()
  }
  _checkReceipt() {
    this.statusCallback(Status.checkingReceipt)

    this._checkIssuerSignature()
  }
  _checkIssuerSignature() {
    this.statusCallback(Status.checkingIssuerSignature)

    this._checkRevokedStatus()
  }
  _checkRevokedStatus() {
    this.statusCallback(Status.checkingRevokedStatus)

    this._failed("Proper certificate validation isn't implemented yet.");
  }
  _succeed() {
    this.statusCallback(Status.success)
  }
  _failed(reason) {
    this.statusCallback(Status.failure, reason)
  }
}
