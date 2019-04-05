{times} = require('underscore')
{equal} = expect = require('assert')
r = require('./randomize')

ITERATIONS = 1000

describe 'randomize', ->
  it 'returns booleans when called without any arguments', ->
    times ITERATIONS, ->
      result = r()
      expect result in [true, false]

  it 'returns 0-n when called with a number', ->
    times ITERATIONS, ->
      result = r(10)
      expect result in [0,1,2,3,4,5,6,7,8,9]

  it 'returns a random array member when called with an array', ->
    fakeArray = ['foo', 'bar', 'baz', 'qux']
    times ITERATIONS, ->
      result = r(fakeArray)
      expect result in fakeArray

  it 'returns a random property when called with an object', ->
    fakeObject = a: 1, b: 2, c: 3, d: 4, e: 5, f: 6
    times ITERATIONS, ->
      result = r(fakeObject)
      # expect result in [{1,2,3,4,5,6]

      keys = Object.keys(result)
      equal keys.length, 1
      key = keys[0]
      value = result[key]

      switch key
        when 'a' then equal value, 1
        when 'b' then equal value, 2
        when 'c' then equal value, 3
        when 'd' then equal value, 4
        when 'e' then equal value, 5
        when 'f' then equal value, 6

  it 'returns a random argument when called with multiple arguments', ->
    fakeArray = ['foo', 'bar', 'baz', 'qux']
    times ITERATIONS, ->
      result = r.apply(null, fakeArray)
      expect result in fakeArray

  it 'returns a random character when called with a string', ->
    times ITERATIONS, ->
      result = r('foobar')
      expect result in ['f','o','b','a','r']

  it 'returns null otherwise', ->
    times ITERATIONS, ->
      result = r(NaN)
      equal result,  null
