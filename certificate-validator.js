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
    this.statusCallback(Status.fetchingRemoteHash)

    this._compareHashes()
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

    this._succeed()
  }
  _succeed() {
    this.statusCallback(Status.success)
  }
  _failed(reason) {
    this.statusCallback(success.failure, reason)
  }
}
