const assert = require('assert')
const benchmark = require('benchmark')
const local = require('../')
const npm = require('typeforce')
const TYPES = require('../test/types')
const VALUES = require('../test/values')
const fixtures = require('../test/fixtures').valid

fixtures.forEach(function (f) {
  const type = TYPES[f.typeId] || f.type
  const value = VALUES[f.valueId] || f.value
  const ctype = local.compile(type)

  local(ctype, value, f.strict)
  npm(ctype, value, f.strict)
})

// benchmark.options.minTime = 1
fixtures.forEach(function (f) {
  const suite = new benchmark.Suite()
  const tdescription = JSON.stringify(f.type)
  const type = TYPES[f.typeId] || f.type
  const value = VALUES[f.valueId] || f.value
  const ctype = local.compile(type)

  if (f.exception) {
    assert.throws(function () { local(f.type, value, f.strict) }, new RegExp(f.exception))
    assert.throws(function () { npm(f.type, value, f.strict) }, new RegExp(f.exception))
    assert.throws(function () { local(ctype, value, f.strict) }, new RegExp(f.exception))
    assert.throws(function () { npm(ctype, value, f.strict) }, new RegExp(f.exception))

    suite.add('local(e)#' + tdescription, function () { try { local(f.type, value, f.strict) } catch (e) {} })
    suite.add('  npm(e)#' + tdescription, function () { try { npm(f.type, value, f.strict) } catch (e) {} })
    suite.add('local(c, e)#' + tdescription, function () { try { local(ctype, value, f.strict) } catch (e) {} })
    suite.add('  npm(c, e)#' + tdescription, function () { try { npm(ctype, value, f.strict) } catch (e) {} })
  } else {
    suite.add('local#' + tdescription, function () { local(f.type, value, f.strict) })
    suite.add('  npm#' + tdescription, function () { npm(f.type, value, f.strict) })
    suite.add('local(c)#' + tdescription, function () { local(ctype, value, f.strict) })
    suite.add('  npm(c)#' + tdescription, function () { npm(ctype, value, f.strict) })
  }

  // after each cycle
  suite.on('cycle', function (event) {
    console.log('*', String(event.target))
  })

  // other handling
  suite.on('complete', function () {
    console.log('\n> Fastest is' + (' ' + this.filter('fastest').pluck('name').join(' | ')).replace(/\s+/, ' ') + '\n')
  })

  suite.on('error', function (event) {
    throw event.target.error
  })

  suite.run()
})
