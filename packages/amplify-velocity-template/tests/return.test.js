var Velocity = require('../src/velocity')
var assert = require("assert")
var parse = Velocity.parse
var Compile = Velocity.Compile

describe('Return', function() {
  var render = Velocity.render;

  function getContext(str, context, macros) {
    var compile = new Compile(parse(str))
    compile.render(context, macros)
    return compile.context
  }

  it('return value', function() {
    var tpl = `#return ([1,2,3])`
    const html = render(tpl)
    console.log(tpl);
    html.should.containEql('[1, 2, 3]')
  })

  it('return empty value', function() {
    var tpl = `#return`
    const html = render(tpl)
    console.log(tpl);
    html.should.containEql('')
  })

  it('return empty value', function() {
    var tpl = `#return(null)`
    const html = render(tpl)
    console.log(tpl);
    html.should.containEql('')
  })

})
