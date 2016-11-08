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
    this._certificateState = {}
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
    // 5. check reciept
    // 6. check issuer signature. See 1.1 #4

  }
  _computeLocalHash() {
    this.statusCallback(Status.computingLocalHash)

    this._fetchRemoteHash()
  }
  _fetchRemoteHash() {
    this.statusCallback(Status.fetchingRemoteHash)

    this._compareHashes()
  }
  _compareHashes() {
    this.statusCallback(Status.comparingHashes)

    let isVersionDotTwo = true;
    if (isVersionDotTwo) {
      this._checkMerkleRoot()
    } else {
      this._checkIssuerSignature()
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
