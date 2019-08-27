var Velocity = require('../src/velocity')
var assert = require("assert")
var parse = Velocity.parse
var Compile = Velocity.Compile

describe('Set && Expression', function() {
  var render = Velocity.render;

  function getContext(str, context, macros) {
    var compile = new Compile(parse(str))
    compile.render(context, macros)
    return compile.context
  }

  it('set equal to reference', function() {
    var vm = '#set( $monkey = $bill ) ## variable reference'
    assert.equal("hello", getContext(vm, {bill: 'hello'}).monkey)
  })

  it('empty map', function() {
    var vm = '#set($foo = {})'
    assert.deepEqual({}, getContext(vm).foo)
  })

  it('#set array', function() {
    var vm = '#set($foo = []) #set($foo[0] = 12)'
    assert.equal(12, getContext(vm).foo[0])
  })

  it('set equal to literal', function() {
    var vm = "#set( $monkey.Friend = 'monica' ) ## string literal\n" +
             '#set( $monkey.Number = 123 ) ##number literal'
    assert.equal("monica", getContext(vm).monkey.Friend)
    assert.equal("123", getContext(vm).monkey.Number)
  })

  it('set equal to result of method ', function () {
    var vm = "#set( $monkey = 'monica' ) ## string literal\n" +
             '#set( $result = $monkey.substring(1) ) ##calling method'
    assert.equal("monica", getContext(vm).monkey)
    assert.equal("onica", getContext(vm).result)
  })

  it('set equal to result of method ', function () {
    var vm = "#set( $monkey = 1234 ) ## number literal\n" +
             '#set( $result = $monkey.toString() ) ##calling method'
    assert.equal("1234", getContext(vm).monkey)
    assert.equal("1234", getContext(vm).result)
  })

  it('equal to method/property reference', function() {
    var vm = "#set($monkey.Blame = $spindoctor.Leak) ## property \n" +
             '#set( $monkey.Plan = $spindoctor.weave($web) ) ## method'
    var obj = {
      spindoctor: {
        weave: function(name) {
          return name
        },
        Leak: "hello world"
      },
      web: "name"
    }

    assert.equal("hello world", getContext(vm, obj).monkey.Blame)
    assert.equal("name", getContext(vm, obj).monkey.Plan)
  })


  it('equal to map/list', function() {
    var vms = [
      '#set( $monkey.Say = ["Not", $my, "fault"] ) ## ArrayList',
      '#set( $monkey.Map = {"banana" : "good", "roast beef" : "bad"}) ## Map'
    ]

    var list = ["Not", "my", "fault"]
    var map = {banana: "good", 'roast beef': "bad"}
    assert.deepEqual(list, getContext(vms[0], {my: "my"}).monkey.Say)
    assert.deepEqual(map, getContext(vms[1]).monkey.Map)
  })

  it('expression simple math', function() {
    assert.equal(10, getContext('#set($foo = 2 * 5)').foo)
    assert.equal(2, getContext('#set($foo = 4 / 2)').foo)
    assert.equal(-3, getContext('#set($foo = 2 - 5)').foo)
    assert.equal(1, getContext('#set($foo = 5 % 2)').foo)
    assert.equal(7, getContext('#set($foo = 7)').foo)
  })

  it('math with decimal', function() {
    assert.equal(10.5, getContext('#set($foo = 2.1 * 5)').foo)
    assert.equal(2.1, getContext('#set($foo = 4.2 / 2)').foo)
    assert.equal(-7.5, getContext('#set($foo = - 2.5 - 5)').foo)
  })

  it('expression complex math', function() {
    assert.equal(20, getContext('#set($foo = (7 + 3) * (10 - 8))').foo)
    assert.equal(-20, getContext('#set($foo = -(7 + 3) * (10 - 8))').foo)
    assert.equal(-1, getContext('#set($foo = -7 + 3 * (10 - 8))').foo)
  })

  it('expression compare', function() {
    assert.equal(false, getContext('#set($foo = 10 > 11)').foo)
    assert.equal(true, getContext('#set($foo = 10 < 11)').foo)
    assert.equal(true, getContext('#set($foo = 10 != 11)').foo)
    assert.equal(true, getContext('#set($foo = 10 <= 11)').foo)
    assert.equal(true, getContext('#set($foo = 11 <= 11)').foo)
    assert.equal(false, getContext('#set($foo = 12 <= 11)').foo)
    assert.equal(true, getContext('#set($foo = 12 >= 11)').foo)
    assert.equal(false, getContext('#set($foo = 10 == 11)').foo)
  })


  it('expression logic', function() {
    assert.equal(false, getContext('#set($foo = 10 == 11 && 3 > 1)').foo)
    assert.equal(true, getContext('#set($foo = 10 < 11 && 3 > 1)').foo)
    assert.equal(true, getContext('#set($foo = 10 > 11 || 3 > 1)').foo)
    assert.equal(true, getContext('#set($foo = !(10 > 11) && 3 > 1)').foo)
    assert.equal(false, getContext('#set($foo = $a > $b)', {a: 1, b: 2}).foo)
    assert.equal(false, getContext('#set($foo = $a && $b)', {a: 1, b: 0}).foo)
    assert.equal(true, getContext('#set($foo = $a || $b)', {a: 1, b: 0}).foo)
  })


  it('var in key', function() {
    var vm = '#set($o = {}) #set($key = "k") #set($o[$key] = "c") #set($o.f = "d") $o $o[$key]'
    var ret = render(vm).replace(/\s+/g, '')
    assert.equal('{k=c,f=d}c', ret)

    var vm2 = `
      #set($obj = {})
      #set($objlist = [
        {"k": "a"},
        {"k": "b"},
        {"k": "c"}
      ])
      #foreach( $item in $!{objlist} )
        #set($obj[$item.k] = $item)
      #end
      $obj
    `
    var ret2 = render(vm2).replace(/\s+/g, '')
    assert.equal('{a={k=a},b={k=b},c={k=c}}', ret2);
  })

  it('#set context should be global, #25', function() {
    var vm = '#macro(local) #set($val =1) $val #end #local() $val'
    var ret = render(vm).replace(/\s+/g, '')
    assert.equal('11', ret)
  })

  it('#set should support settinng string place holders', function() {
    var vm = `
    #set ($val = "Foo")
    #set ($sortKeyValue = "Moo")
    #set($res = "$sortKeyValue#$val")
    $res
    `
    var ret = render(vm).replace(/\s+/g, '')
    assert.equal('Moo#Foo', ret)
  })

  describe('set mult level var', function() {
    it('normal, fix #63', function() {
      var tpl = `
        #set($a = { "b": {} })
        #set($a.b.c1 = 1)
        #set($a.b.c2 = 2)
      `
      var context = getContext(tpl)
      context.a.b.should.have.properties('c1', 'c2')
    })

    it('set fail', function() {
      var tpl = `
        #set($a = { "b": {} })
        #set($a.b.c1 = 1)
        #set($a.b.c2 = 2)
        #set($a.d.c2 = 2)
      `
      var context = getContext(tpl)
      context.a.should.not.have.property('d')
    })
  })

  it('set with foreach', function() {
    var tpl = `
#foreach($item in [1..2])
  #set($bTest = false)
  #if($item > 1) #set($bTest = true) #end
  <h1>$bTest</h1>
#end`
    const html = render(tpl)
    html.should.containEql('true')
    html.should.containEql('false')
  })

  it('set error #78', function() {
    var tpl = `
      #foreach($item in [1..4])
        #set($bTest = "test1")
        #if($item % 2 == 0)
          #set($bTest = "$!{bTest} test2")
        #end
        #set($bTest = "$!{bTest} test3")
        <h1>$bTest</h1>
      #end
    `
    const html = render(tpl).replace(/\n\s.|\s{2}/g, '').trim();
    html.should.eql('<h1>test1 test3</h1><h1>test1 test2 test3</h1><h1>test1 test3</h1><h1>test1 test2 test3</h1>');
  })

})
