var typeforce = require('../')

function Unmatchable () { return false }
function Letter (value) {
  return /^[a-z]$/i.test(value)
}

module.exports = {
  '(Boolean, Number)': typeforce.tuple('Boolean', 'Number'),
  '(Number|String)': typeforce.tuple(typeforce.oneOf('Number', 'String')),
  '(Number)': typeforce.tuple('Number'),
  '[?{ a: Number }]': [ typeforce.maybe({ a: 'Number' }) ],
  'Boolean|Number|String': typeforce.oneOf('Boolean', 'Number', 'String'),
  '?Boolean|Number': typeforce.maybe(typeforce.oneOf('Boolean', 'Number')),
  '?{ a: ?Number }': typeforce.maybe({ a: '?Number' }),
  '?{ a: Number }': typeforce.maybe({ a: 'Number' }),
  '{ a: Number|Null }': { a: typeforce.oneOf('Number', 'Null') },
  '{ a: Number|{ b: Number } }': { a: typeforce.oneOf('Number', { b: 'Number' }) },
  '{ a: ?{ b: Number } }': { a: typeforce.maybe({ b: 'Number' }) },
  '{ a: ?{ b: ?{ c: Number } } }': { a: typeforce.maybe({ b: typeforce.maybe({ c: 'Number' }) }) },
  '{ a: undefined }': { a: undefined },
  '@{ a: undefined }': typeforce.object({ a: undefined }), // DEPRECATED
  'Unmatchable': Unmatchable,
  '?Unmatchable': typeforce.maybe(Unmatchable),
  '{ a: ?Unmatchable }': { a: typeforce.maybe(Unmatchable) },
  '{ a: { b: Unmatchable } }': { a: { b: Unmatchable } },
  '>CustomType': typeforce.quacksLike('CustomType'),
  '{ String }': typeforce.map('String'),
  '{ String|Number }': typeforce.map(typeforce.oneOf('String', 'Number')),
  '{ String: Number }': typeforce.map('Number', 'String'),
  '{ Letter: Number }': typeforce.map('Number', Letter),
  '{ a: { b: Buffer3 } }': { a: { b: typeforce.BufferN(3) } },
  '{ a: Buffer10|Number }': { a: typeforce.oneOf(typeforce.BufferN(10), 'Number') },
  'Buffer0': typeforce.BufferN(0),
  'Buffer3': typeforce.BufferN(3),
  'Buffer10': typeforce.BufferN(10),
  'Hex': typeforce.Hex,
  'Hex64': typeforce.HexN(64),
  'Int8': typeforce.Int8,
  'Int16': typeforce.Int16,
  'Int32': typeforce.Int32,
  'UInt8': typeforce.UInt8,
  'UInt16': typeforce.UInt16,
  'UInt32': typeforce.UInt32,
  'UInt53': typeforce.UInt53
}
