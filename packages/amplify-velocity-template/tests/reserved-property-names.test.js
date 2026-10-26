var Velocity = require('../src/velocity');
require('should');

describe('reserved property names in reference resolution', function () {
  var render = Velocity.render;

  afterEach(function () {
    delete global.__vtlReserved;
    delete Object.prototype.polluted;
    delete Object.prototype.y;
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
