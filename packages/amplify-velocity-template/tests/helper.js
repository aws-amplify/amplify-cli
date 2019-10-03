'use strict';
var Velocity = require('../src/velocity')
var assert = require("assert")

describe('Helper', function() {
  var getRefText = Velocity.Helper.getRefText
  var parse = Velocity.parse
  describe('getRefText', function() {
    it('simple reference', function() {
      var foo = '$a.b'
      var ast = parse(foo)[0]
      assert.equal(getRefText(ast), foo)
    })

    it('reference method', function() {
      var foo = '$a.b()'
      var ast = parse(foo)[0]
      assert.equal(getRefText(ast), foo)
    })

    it('reference method with arguments', function() {
      var foo = '$a.b("hello")'
      var ast = parse(foo)[0]
      assert.equal(getRefText(ast), foo)

      foo = '$a.b(\'hello\')'
      ast = parse(foo)[0]
      assert.equal(getRefText(ast), foo)

      foo = '$a.b(\'hello\',10)'
      ast = parse(foo)[0]
      assert.equal(getRefText(ast), foo)
    })

    it('reference method with arguments array', function() {
      var foo = '$a.b(["hello"])'
      var ast = parse(foo)[0]
      assert.equal(getRefText(ast), foo)

      foo = '$a.b([\'hello\', 2])'
      ast = parse(foo)[0]
      assert.equal(getRefText(ast), foo)
    })

    it('reference index', function() {
      var foo = '$a.b[1]'
      var ast = parse(foo)[0]
      assert.equal(getRefText(ast), foo)

      foo = '$a.b["cc"]'
      ast = parse(foo)[0]
      assert.equal(getRefText(ast), foo)

      foo = '$a.b[\'cc\']'
      ast = parse(foo)[0]
      assert.equal(getRefText(ast), foo)
    })
  })
})
