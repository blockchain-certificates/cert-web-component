const typeforce = require('../')
const TYPES = require('../test/types')
const VALUES = require('../test/values')

const TYPES2 = [
  'Array',
  'Boolean',
  'Buffer',
  'Function',
  'Null',
  'Number',
  'Object',
  'String',
  '?Number',
  [ '?Number' ],
  [ 'Number' ],
  [ { a: 'Number' } ],
  {},
  { a: 'Number' },
  { a: { b: 'Number' } },
  { a: { b: { c: '?Number' } } },
  { a: { b: { c: 'Number' } } },
  { a: null },

  // these will resolve to typeforce.value(...)
  undefined,
  null,
  true,
  false,
  0
]

const VALUES2 = [
  '',
  'foobar',
  0,
  1,
  [],
  [0],
  ['foobar'],
  [{ a: 0 }],
  [null],
  false,
  true,
  undefined,
  null,
  {},
  { a: null },
  { a: 0 },
  { a: 0, b: 0 },
  { b: 0 },
  { a: { b: 0 } },
  { a: { b: null } },
  { a: { b: { c: 0 } } },
  { a: { b: { c: null } } },
  { a: { b: { c: 0, d: 0 } } },
  { a: 'foo', b: 'bar' },
  { a: 'foo', b: { c: 'bar' } }
]

// extra
const VALUESX = [
  'fff',
  'cafe1122deadbeef',
  '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20',
  -1,
  127,
  128,
  255,
  256,
  -128,
  -129,
  0xfffe,
  0xffff,
  0x10000,
  0xffffffff,
  9007199254740991,
  9007199254740994
]

const fixtures = {
  valid: [],
  invalid: []
}

function addFixture (type, value) {
  const f = {}
  let atype, avalue

  if (TYPES[type]) {
    f.typeId = type
    atype = TYPES[type]
  } else {
    f.type = type
    atype = type
  }

  if (VALUES[value]) {
    f.valueId = value
    avalue = VALUES[value]
  } else {
    f.value = value
    avalue = value
  }

  try {
    typeforce(atype, avalue, true)
    fixtures.valid.push(f)
  } catch (e) {
    let exception = e.message
      .replace(/([.*+?^=!:${}\[\]\/\\\(\)])/g, '\\$&')

    try {
      typeforce(atype, avalue, false)
      fixtures.valid.push(f)

      if (exception.indexOf('asciiSlice') !== -1) return
      fixtures.invalid.push(Object.assign({ exception, strict: true }, f))
    } catch (e) {
      if (exception.indexOf('asciiSlice') !== -1) return
      fixtures.invalid.push(Object.assign({ exception }, f))
    }
  }
}

const ALLTYPES = TYPES2.concat(Object.keys(TYPES))
const ALLVALUES = VALUES2.concat(Object.keys(VALUES))

ALLTYPES.forEach(type => ALLVALUES.forEach(value => addFixture(type, value)))
ALLTYPES.forEach(type => VALUESX.forEach(value => addFixture(type, value)))

console.log(JSON.stringify(fixtures, null, 2))
