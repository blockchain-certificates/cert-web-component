(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Certificate = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Certificate = function () {
  function Certificate(name, title, subtitle, description, certificateImage, signatureImage, sealImage) {
    _classCallCheck(this, Certificate);

    this.name = name;
    this.title = title;
    this.subtitle = subtitle;
    this.description = description;
    this.certificateImage = certificateImage;
    this.signatureImage = signatureImage;
    this.sealImage = sealImage;
  }

  _createClass(Certificate, null, [{
    key: "parseV1",
    value: function parseV1(certificateJson) {
      var certificate = certificateJson.certificate || certificateJson.document.certificate;
      var recipient = certificateJson.recipient || certificateJson.document.recipient;
      var certificateImage = certificate.image;
      var name = recipient.givenName + " " + recipient.familyName;
      var title = certificate.title || certificate.name;
      var description = certificate.description;
      var signatureImage = certificateJson.document && certificateJson.document.assertion && certificateJson.document.assertion["image:signature"];
      var sealImage = certificate.issuer.image;
      var subtitle = certificate.subtitle;
      if ((typeof subtitle === "undefined" ? "undefined" : _typeof(subtitle)) == "object") {
        subtitle = subtitle.display ? subtitle.content : "";
      }
      return new Certificate(name, title, subtitle, description, certificateImage, signatureImage, sealImage);
    }
  }, {
    key: "parseV2",
    value: function parseV2(certificateJson) {
      var recipient = certificateJson.recipient;
      var badge = certificateJson.badge;
      var certificateImage = certificateJson.image;
      var name = recipient.recipientProfile.name;
      var title = badge.name;
      var description = badge.description;
      var signatureImage = badge.signatureLines;
      var sealImage = badge.issuer.image;
      var subtitle = badge.subtitle;
      return new Certificate(name, title, subtitle, description, certificateImage, signatureImage, sealImage);
    }
  }, {
    key: "parseJson",
    value: function parseJson(certificateJson) {
      var version = certificateJson["@context"];
      if (version instanceof Array) {
        return this.parseV2(certificateJson);
      } else {
        return this.parseV1(certificateJson);
      }
    }
  }]);

  return Certificate;
}();

module.exports = Certificate;

},{}]},{},[1])(1)
});