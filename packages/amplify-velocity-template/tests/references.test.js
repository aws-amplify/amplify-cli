var Velocity = require('../src/velocity');
require('should');

describe('Reference resolver property access', function () {
  var render = Velocity.render;

  it('does not resolve constructor via dot or bracket access', function () {
    render('$!ctx.constructor', { ctx: { name: 'foo' } }).should.eql('');
    render("$!ctx['constructor']", { ctx: { name: 'foo' } }).should.eql('');
  });

  it('does not resolve chained constructor access', function () {
    render('$!ctx.constructor.constructor("return 1")', { ctx: { name: 'foo' } }).should.eql('');
  });

  it('does not execute a chained constructor invocation', function () {
    delete global.__vtlMarker;
    var vm = '$!ctx.constructor.constructor("globalThis.__vtlMarker = true").call()';
    render(vm, { ctx: { name: 'foo' } }).should.eql('');
    (global.__vtlMarker === undefined).should.eql(true);
  });

  it('does not expose the prototype chain', function () {
    render('$!ctx.__proto__', { ctx: { name: 'foo' } }).should.eql('');
    render('$!ctx.prototype', { ctx: { name: 'foo' } }).should.eql('');
    render("$!ctx['__proto__']", { ctx: { name: 'foo' } }).should.eql('');
  });

  it('still resolves normal data access', function () {
    render('$ctx.name', { ctx: { name: 'foo' } }).should.eql('foo');
    render("$ctx['name']", { ctx: { name: 'foo' } }).should.eql('foo');
  });

  it('still resolves normal method calls', function () {
    render('$str.toUpperCase()', { str: 'foo' }).should.eql('FOO');
    render('$list.size()', { list: [1, 2, 3] }).should.eql('3');
    render('$map.keySet()', { map: { a: 1, b: 2 } }).should.eql('[a, b]');
  });
});
