var buffer3 = new Buffer('ffffff', 'hex')
var buffer10 = new Buffer('ffffffffffffffffffff', 'hex')

module.exports = {
  'function': function () {},
  'emptyType': new function EmptyType () {}(),
  'customType': new function CustomType () { this.x = 2 }(),
  '{ a: undefined }': { a: undefined },
  '{ a: Buffer3 }': { a: buffer3 },
  '{ a: Buffer10 }': { a: buffer10 },
  '{ a: { b: Buffer3 } }': { a: { b: buffer3 } },
  '{ a: { b: Buffer10 } }': { a: { b: buffer10 } },
  'Buffer': new Buffer(0),
  'Buffer3': buffer3,
  'Buffer10': buffer10
}
