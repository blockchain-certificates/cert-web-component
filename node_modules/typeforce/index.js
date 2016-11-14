var errors = require('./errors')
var native = require('./native')

// short-hand
var tfJSON = errors.tfJSON
var TfTypeError = errors.TfTypeError
var TfPropertyTypeError = errors.TfPropertyTypeError
var tfSubError = errors.tfSubError
var getValueTypeName = errors.getValueTypeName

var types = {
  arrayOf: function arrayOf (type) {
    type = compile(type)

    function _arrayOf (array, strict) {
      if (!native.Array(array)) return false

      return array.every(function (value, i) {
        try {
          return typeforce(type, value, strict)
        } catch (e) {
          throw tfSubError(e, i)
        }
      })
    }
    _arrayOf.toJSON = function () { return '[' + tfJSON(type) + ']' }

    return _arrayOf
  },

  maybe: function maybe (type) {
    type = compile(type)

    function _maybe (value, strict) {
      return native.Null(value) || type(value, strict, maybe)
    }
    _maybe.toJSON = function () { return '?' + tfJSON(type) }

    return _maybe
  },

  map: function map (propertyType, propertyKeyType) {
    propertyType = compile(propertyType)
    if (propertyKeyType) propertyKeyType = compile(propertyKeyType)

    function _map (value, strict) {
      if (!native.Object(value, strict)) return false
      if (native.Null(value, strict)) return false

      for (var propertyName in value) {
        try {
          if (propertyKeyType) {
            typeforce(propertyKeyType, propertyName, strict)
          }
        } catch (e) {
          throw tfSubError(e, propertyName, 'key')
        }

        try {
          var propertyValue = value[propertyName]
          typeforce(propertyType, propertyValue, strict)
        } catch (e) {
          throw tfSubError(e, propertyName)
        }
      }

      return true
    }

    if (propertyKeyType) {
      _map.toJSON = function () {
        return '{' + tfJSON(propertyKeyType) + ': ' + tfJSON(propertyType) + '}'
      }
    } else {
      _map.toJSON = function () { return '{' + tfJSON(propertyType) + '}' }
    }

    return _map
  },

  object: function object (uncompiled) {
    var type = {}

    for (var propertyName in uncompiled) {
      type[propertyName] = compile(uncompiled[propertyName])
    }

    function _object (value, strict) {
      if (!native.Object(value)) return false
      if (native.Null(value)) return false

      var propertyName

      try {
        for (propertyName in type) {
          var propertyType = type[propertyName]
          var propertyValue = value[propertyName]

          typeforce(propertyType, propertyValue, strict)
        }
      } catch (e) {
        throw tfSubError(e, propertyName)
      }

      if (strict) {
        for (propertyName in value) {
          if (type[propertyName]) continue

          throw new TfPropertyTypeError(undefined, propertyName)
        }
      }

      return true
    }
    _object.toJSON = function () { return tfJSON(type) }

    return _object
  },

  oneOf: function oneOf () {
    var types = [].slice.call(arguments).map(compile)

    function _oneOf (value, strict) {
      return types.some(function (type) {
        try {
          return typeforce(type, value, strict)
        } catch (e) {
          return false
        }
      })
    }
    _oneOf.toJSON = function () { return types.map(tfJSON).join('|') }

    return _oneOf
  },

  quacksLike: function quacksLike (type) {
    function _quacksLike (value) {
      return type === getValueTypeName(value)
    }
    _quacksLike.toJSON = function () { return type }

    return _quacksLike
  },

  tuple: function tuple () {
    var types = [].slice.call(arguments).map(compile)

    function _tuple (values, strict) {
      return types.every(function (type, i) {
        try {
          return typeforce(type, values[i], strict)
        } catch (e) {
          throw tfSubError(e, i)
        }
      }) && (!strict || values.length === arguments.length)
    }
    _tuple.toJSON = function () { return '(' + types.map(tfJSON).join(', ') + ')' }

    return _tuple
  },

  value: function value (expected) {
    function _value (actual) {
      return actual === expected
    }
    _value.toJSON = function () { return expected }

    return _value
  }
}

function compile (type) {
  if (native.String(type)) {
    if (type[0] === '?') return types.maybe(compile(type.slice(1)))

    return native[type] || types.quacksLike(type)
  } else if (type && native.Object(type)) {
    if (native.Array(type)) return types.arrayOf(compile(type[0]))

    return types.object(type)
  } else if (native.Function(type)) {
    return type
  }

  return types.value(type)
}

function typeforce (type, value, strict, surrogate) {
  if (native.Function(type)) {
    if (type(value, strict)) return true

    throw new TfTypeError(surrogate || type, value)
  }

  // JIT
  return typeforce(compile(type), value, strict)
}

// assign types to typeforce function
for (var typeName in native) {
  typeforce[typeName] = native[typeName]
}

for (typeName in types) {
  typeforce[typeName] = types[typeName]
}

var extra = require('./extra')
for (typeName in extra) {
  typeforce[typeName] = extra[typeName]
}

typeforce.compile = compile
typeforce.TfTypeError = TfTypeError
typeforce.TfPropertyTypeError = TfPropertyTypeError

module.exports = typeforce
