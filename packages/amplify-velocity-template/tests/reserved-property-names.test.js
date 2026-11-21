var Velocity = require('../src/velocity');
require('should');

describe('reserved property names in reference resolution', function () {
  var render = Velocity.render;

  afterEach(function () {
    delete global.__vtlReserved;
    delete Object.prototype.polluted;
    delete Object.prototype.y;
    delete Object.prototype.p;
  });

  it('does not resolve constructor via getConstructor() accessor', function () {
    render('$!ctx.getConstructor()', { ctx: { name: 'foo' } }).should.eql('');
  });

  it('does not invoke a resolved constructor via getConstructor() chained call', function () {
    global.__vtlReserved = false;
    var vm = '$!ctx.getConstructor().getConstructor("globalThis.__vtlReserved = true").call()';
    render(vm, { ctx: { name: 'foo' } }).should.eql('');
    global.__vtlReserved.should.eql(false);
  });

  it('does not resolve constructor via isConstructor() accessor', function () {
    render('$!ctx.isConstructor()', { ctx: { name: 'foo' } }).should.eql('');
  });

  it('does not resolve constructor via get("constructor")', function () {
    render('$!ctx.get("constructor")', { ctx: { name: 'foo' } }).should.eql('');
  });

  it('does not resolve __proto__ via get("__proto__")', function () {
    render('$!ctx.get("__proto__")', { ctx: { name: 'foo' } }).should.eql('');
  });

  it('does not write via #set on __proto__', function () {
    render('#set($ctx.__proto__.polluted = "yes")', { ctx: { name: 'foo' } });
    (({}).polluted === undefined).should.eql(true);
  });

  it('does not write via #set on constructor.prototype', function () {
    render('#set($ctx.constructor.prototype.y = "yes")', { ctx: { name: 'foo' } });
    (({}).y === undefined).should.eql(true);
  });

  it('does not write a reserved key via put("constructor", ...)', function () {
    // Discriminating: without the guard, put() assigns an own "constructor"
    // key (hasOwnProperty becomes true). put("__proto__", <string>) would be a
    // JS no-op guarded or not, so "constructor" is used to actually exercise it.
    var ctx = { name: 'foo' };
    render('$!ctx.put("constructor", "yes")', { ctx: ctx });
    ctx.hasOwnProperty('constructor').should.eql(false);
  });

  it('does not write a reserved key via set("constructor", ...)', function () {
    var ctx = { name: 'foo' };
    render('$!ctx.set("constructor", "yes")', { ctx: ctx });
    ctx.hasOwnProperty('constructor').should.eql(false);
  });

  it('does not write a reserved key via setconstructor(...) accessor', function () {
    // Discriminating: the setter path takes id.slice(3) verbatim with no
    // re-casing, so the lowercase "setconstructor" produces the reserved key
    // "constructor" that the guard actually matches. (Capitalized
    // "setConstructor" slices to "Constructor", which is not reserved and never
    // exercises the guard.) Without the guard this writes an own "constructor".
    var ctx = { name: 'foo' };
    render('$!ctx.setconstructor("yes")', { ctx: ctx });
    ctx.hasOwnProperty('constructor').should.eql(false);
  });

  it('renders a rejected setconstructor(...) like other rejected writes', function () {
    render('$ctx.setconstructor("yes")', { ctx: { name: 'foo' } }).should.eql('');
  });

  it('does not write through a reserved root identifier via #set', function () {
    render('#set($__proto__.p = "x")', { ctx: { name: 'foo' } });
    (({}).p === undefined).should.eql(true);
  });

  it('does not assign a reserved root identifier via #set', function () {
    var context = { name: 'foo' };
    render('#set($__proto__ = {"p": "x"})', context);
    (Object.getPrototypeOf(context) === Object.prototype).should.eql(true);
  });

  it('does not resolve a reserved root identifier in a reference', function () {
    render('$!constructor.assign($__proto__, {"p":"x"})', { ctx: { name: 'foo' } });
    (({}).p === undefined).should.eql(true);
  });

  it('does not resolve a reserved root identifier from a #foreach scope', function () {
    render('#foreach($i in [1])$!constructor.assign($__proto__, {"p":"x"})#end', {});
    (({}).p === undefined).should.eql(true);
  });

  it('does not read or delete a reserved key via remove()', function () {
    var vm = '$!ctx.remove("constructor").assign($ctx.remove("__proto__"), {"p":"x"})';
    render(vm, { ctx: { name: 'foo' } });
    (({}).p === undefined).should.eql(true);
  });

  it('still removes a normal key via remove()', function () {
    var ctx = { name: 'foo', k: 'v' };
    render('$ctx.remove("k")', { ctx: ctx }).should.eql('v');
    ctx.hasOwnProperty('k').should.eql(false);
  });

  it('still resolves a normal root identifier, including inside #foreach', function () {
    render('$a#foreach($i in [1])$a$i#end', { a: 'x' }).should.eql('xx1');
  });

  it('still resolves a normal getter accessor', function () {
    render('$obj.getName()', { obj: { name: 'foo' } }).should.eql('foo');
  });

  it('still writes a normal property via #set', function () {
    render('#set($ctx.bar = "baz")$ctx.bar', { ctx: { name: 'foo' } }).should.eql('baz');
  });

  it('still writes a normal property via put()', function () {
    var map = {};
    render('$!map.put("k", "v")', { map: map });
    map.k.should.eql('v');
  });
});

describe('property keys that are not plain strings', function () {
  var render = Velocity.render;

  afterEach(function () {
    delete Object.prototype.p;
  });

  function wrapped(value) {
    return {
      toString: function () {
        return value;
      },
    };
  }

  it('treats a list key the same as the equivalent string key on read', function () {
    render('#set($k = ["constructor"])$!x[$k]', { x: {} }).should.eql('');
    render('$!x["constructor"]', { x: {} }).should.eql('');
  });

  it('treats a nested list key the same as the equivalent string key on read', function () {
    render('#set($k = [["constructor"]])$!x[$k]', { x: {} }).should.eql('');
  });

  it('treats a wrapped string key the same as the equivalent string key on read', function () {
    render('$!x[$k]', { x: {}, k: wrapped('constructor') }).should.eql('');
  });

  it('treats a list key the same as the equivalent string key on put', function () {
    var x = {};
    render('#set($k = ["__proto__"])$!x.put($k, $y)', { x: x, y: { p: 1 } });
    Object.keys(x).length.should.eql(0);
    (Object.getPrototypeOf(x) === Object.prototype).should.eql(true);
    (({}).p === undefined).should.eql(true);
  });

  it('treats a wrapped string key the same as the equivalent string key on put', function () {
    var x = {};
    render('$!x.put($k, $y)', { x: x, y: 'v', k: wrapped('__proto__') });
    Object.keys(x).length.should.eql(0);
    (Object.getPrototypeOf(x) === Object.prototype).should.eql(true);
  });

  it('treats a list key the same as the equivalent string key on #set', function () {
    var x = {};
    render('#set($k = ["__proto__"])#set($x[$k] = $y)', { x: x, y: { p: 1 } });
    (Object.getPrototypeOf(x) === Object.prototype).should.eql(true);
    (({}).p === undefined).should.eql(true);
  });

  it('treats a nested list key the same as the equivalent string key on #set', function () {
    var x = {};
    render('#set($k = [["__proto__"]])#set($x[$k] = $y)', { x: x, y: { p: 1 } });
    (Object.getPrototypeOf(x) === Object.prototype).should.eql(true);
    (({}).p === undefined).should.eql(true);
  });

  it('treats a wrapped string key the same as the equivalent string key on #set', function () {
    var x = {};
    render('#set($x[$k] = $y)', { x: x, y: { p: 1 }, k: wrapped('__proto__') });
    (Object.getPrototypeOf(x) === Object.prototype).should.eql(true);
    (({}).p === undefined).should.eql(true);
  });

  it('treats a list key the same as the equivalent string key on remove', function () {
    render('#set($k = ["constructor"])$!x.remove($k)', { x: {} }).should.eql('');
  });

  it('still reads and writes with a number key', function () {
    render('$x[1]', { x: ['a', 'b'] }).should.eql('b');
    var x = [];
    render('#set($x[0] = "v")', { x: x });
    x[0].should.eql('v');
    var m = {};
    render('$!m.put(5, "v")', { m: m });
    m['5'].should.eql('v');
  });

  it('still reads and writes with normal string keys', function () {
    render('$x["a"]', { x: { a: 'v' } }).should.eql('v');
    render('#set($k = "a")$x[$k]', { x: { a: 'v' } }).should.eql('v');
    render('#set($k = ["a"])$!x[$k]', { x: { a: 'v' } }).should.eql('v');
    var m = {};
    render('$!m.put("k", "v")#set($m["j"] = "w")', { m: m });
    m.k.should.eql('v');
    m.j.should.eql('w');
  });

  it('treats a list key the same as the equivalent string key on get()', function () {
    render('#set($k = ["constructor"])$!x.get($k)', { x: {} }).should.eql('');
    render('$!x.get($k)', { x: {}, k: wrapped('constructor') }).should.eql('');
    render('#set($k = ["a"])$!x.get($k)', { x: { a: 'v' } }).should.eql('v');
  });

  it('does not throw for a symbol key', function () {
    var s = Symbol('s');
    render('$!x[$k]', { x: {}, k: s }).should.eql('');
  });
});
