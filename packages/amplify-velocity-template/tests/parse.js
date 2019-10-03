'use strict';
var parse = require('../src/velocity').parse
var assert = require("assert")

describe('Parser', function() {

  describe('simple references', function() {

    it('self define block', function() {
      var vm = '#cms(1)<div class="abs-right"> #H(1,"第一个链接") </div> #end';
      var ast = parse(vm, { cms: true });
      assert(ast.length, 1);
      assert(ast[0][0].type, 'cms');
    });

    it('simple references', function() {
      var vm = 'hello world: $foo'
      var ret = parse(vm)

      assert.ok(ret instanceof Array)
      assert.equal(2, ret.length)
      assert.equal('hello world: ', ret[0])
      assert.equal('foo', ret[1].id)
    })

    it('valid variable references', function() {
      var vm = '$mud-Slinger_1'
      assert.equal('mud-Slinger_1', parse(vm)[0].id)
    })

    it('wraped references', function() {
      var vm = '${mudSlinger}'
      var ast = parse(vm)[0]
      assert.equal(true, ast.isWraped)
      assert.equal('mudSlinger', ast.id)
    })

    it('function call references', function() {
      var ast = parse('$foo()')[0]
      assert.equal(false, ast.args)
      assert.equal('references', ast.type)
    })
  })

  describe('Properties', function() {

    it('simple property', function() {
      var vm = '$customer.Address'
      var asts = parse(vm)
      assert.deepEqual(asts[0], {
        id: "customer",
        prue: true,
        type: "references",
        path: [{type: 'property', id: 'Address'}],
        leader: '$',
        pos: { first_line: 1, last_line: 1, first_column: 0, last_column: 17 }
      })
    })

  })

  describe('Methods ', function() {

    it('with no arguments', function() {
      var vm  = '$foo.bar()'
      var ast = parse(vm)[0]

      assert.deepEqual(ast['path'], [{
        type: "method",
        id: "bar",
        args: false
      }])
    })

    it('with arguments integer', function() {
      var vm = '$foo.bar(10)'
      var ast = parse(vm)[0]

      assert.deepEqual(ast['path'], [{
        type: "method",
        id: "bar",
        args: [{
          type: "integer",
          value: "10"
        }]
      }])
    })

    it('with arguments references', function() {
      var vm = '$foo.bar($bar)'
      var ast = parse(vm)[0]

      assert.equal(ast.prue, true)

      assert.deepEqual(ast.path[0].args, [{
        type: "references",
        leader: "$",
        id: "bar"
      }])
    })

  })

  describe('Index', function() {

    it('all kind of indexs', function() {
      var vm = '$foo[0] $foo[$i] $foo["bar"]'
      var asts = parse(vm)

      assert.equal(5, asts.length)

      // asts[0].path[0] => $foo[0]
      // {type: 'index', id: {type: 'integer', value: '0'}}
      assert.equal('index', asts[0].path[0].type)
      assert.equal('integer', asts[0].path[0].id.type)
      assert.equal('0', asts[0].path[0].id.value)

      // asts[2].path[0] => $foo[$i]
      // {type: 'references', id: {type:'references', id: 'i', leader: '$'}}
      assert.equal('index', asts[2].path[0].type)
      assert.equal('references', asts[2].path[0].id.type)
      assert.equal('i', asts[2].path[0].id.id)

      // asts[4].path[0] => $foo["bar"]
      // {type: 'index', id: {type: 'string', value: 'bar', isEval: true}
      assert.equal('index', asts[4].path[0].type)
      assert.equal('string', asts[4].path[0].id.type)
      assert.equal('bar', asts[4].path[0].id.value)

    })

  })

  describe('complex references', function() {

    it('property + index + property', function() {
      var vm = '$foo.bar[1].junk'
      var ast = parse(vm)[0]

      assert.equal('foo', ast.id)
      assert.equal(3, ast.path.length)

      var paths = ast.path

      assert.equal('property', paths[0].type)
      assert.equal('index', paths[1].type)
      assert.equal('property', paths[2].type)

    })


    it('method + index', function() {
      var vm = '$foo.callMethod()[1]'
      var ast = parse(vm)[0]

      assert.equal(2, ast.path.length)

      assert.equal('method', ast.path[0].type)
      assert.equal('callMethod', ast.path[0].id)

      assert.equal('index', ast.path[1].type)
      assert.equal('1', ast.path[1].id.value)
      assert.equal('integer', ast.path[1].id.type)

    })

    it('property should not start with alphabet', function() {
      var asts = parse('$foo.124')
      var ast2 = parse('$foo.-24')[0]

      assert.equal(3, asts.length)
      assert.equal('foo', asts[0].id)
      assert.equal(undefined, asts[0].path)

      assert.equal(undefined, ast2.path)

    })

    it('index should end with close bracket', function() {
      assert.throws(function() {
        parse("$foo.bar['a'12]")
      }, /Parse error/)
    })

  })

  describe('Directives', function() {

    it('#macro', function() {
      var vm = '#macro( d $a $b)#if($b)$a#end#end #d($foo $bar)'
      var asts = parse(vm)

      var ifAst = asts[0][1]

      assert.equal(ifAst[0].condition.type, 'references')
      assert.equal(ifAst[0].condition.id, 'b')
      assert.equal(ifAst[0].condition.prue, undefined)

      assert.equal(ifAst[1].type, 'references')
      assert.equal(ifAst[1].id, 'a')
      assert.equal(ifAst[1].prue, true)

      assert.equal(asts.length, 3)
      assert.equal(ifAst.length, 2)
    })

    it('#setter will work fine', function() {
      var vm = '<a href="#setter" target="_blank"></a>';
      var asts = parse(vm);
      asts.every(function(ast) {
        return typeof ast === 'string';
      }).should.equal(true);
      var vm2 = '<a href="#setter()" target="_blank"></a>';
      asts = parse(vm2);
      asts[1].type.should.equal('macro_call');
    });

  })

  describe('comment identify', function() {

    it('one line comment', function() {
      var asts = parse('#set( $monkey.Number = 123)##number literal')

      assert.equal(2, asts.length)
      assert.equal('comment', asts[1].type)
    })

    it('all comment', function() {
      var asts = parse('##number literal')

      asts.length.should.equal(1)
      asts[0].type.should.equal('comment');

      asts = parse('##');
      asts.length.should.equal(1)
      asts[0].type.should.equal('comment');
    });

  })

  describe('raw identify', function() {
    it('raw content', function() {
      var asts = parse('#[[\nThis content is ignored.\n]]#');

      assert.equal('raw', asts[0].type);
      assert.equal('\nThis content is ignored.\n', asts[0].value);
    });
  });

})
