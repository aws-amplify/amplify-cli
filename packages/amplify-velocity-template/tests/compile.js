'use strict';
var Velocity = require('../src/velocity')
var assert = require("assert")
var parse = Velocity.parse
var Compile = Velocity.Compile

describe('Compile', function() {

  var render = Velocity.render;

  function getContext(str, context, macros) {
    var compile = new Compile(parse(str))
    compile.render(context, macros)
    return compile.context
  }

  describe('References', function() {

    it('get/is method', function() {
      var vm = '$customer.getAddress() $customer.getaddress()'
      var vm1 = '$customer.get("address") $customer.get("Address")'
      var vm3 = '$customer.isAddress() $customer.isaddress()'

      assert.equal('bar bar', render(vm3, {customer: {Address: "bar"}}))

      assert.equal('bar bar', render(vm, {customer: {address: "bar"}}))
      assert.equal('foo bar', render(vm, {
        customer: {
          address: 'bar',
          Address: 'foo'
        }
      }))

      assert.equal('bar bar', render(vm1, {customer: {address: "bar"}}))
      assert.equal('foo bar', render(vm1, {
        customer: {
          Address: 'bar',
          address: 'foo'
        }
      }))
    })

    it('method with attribute', function() {
      var vm = '$foo().bar\n${foo().bar}'
      assert.equal('hello\nhello', render(vm, {
        foo: function() {
          return { bar: 'hello' }
        }
      }))

      assert.equal('foo', render('${foo()}', {
        foo: function() {
          return 'foo'
        }
      }))
    })

    it('index notation', function() {
      var vm = '$foo[0] $foo[$i] $foo.get(1) $xx["oo"]'
      assert.equal('bar haha haha oo', render(vm, {foo: ["bar", "haha"], i: 1, xx: { oo: 'oo' }}))
    })

    it('set method', function() {
      var vm = '$page.setTitle("My Home Page").setname("haha")' +
      '$page.Title $page.name'
      assert.equal('My Home Page haha', render(vm, {page: {}}))
    })

    it('runt type support', function() {
      var vm = '$page.header(page)'
      assert.equal('$page.header(page)', render(vm, {page: {}}))
    })

    it('size method', function() {
      var vm = '$foo.bar.size()'
      assert.equal('2', render(vm, {foo: {bar: [1, 2]}}))
      assert.equal('2', render(vm, {foo: {bar: {a: 1, b: 3}}}))

      var vm2 = '#if($foo.bar.size()) ok #{else} nosize #end'
      assert.equal(' nosize ', render(vm2, {foo: {bar: 123}}))
      assert.equal(' nosize ', render(vm2, {foo: {}}))

      var vm3 = '$foo.size()';
      function fooSize() {
        return 3;
      }
      assert.equal('3', render(vm3, { foo: { size: fooSize } }))
    })

    it('quiet reference', function() {
      var vm = 'my email is $email'
      var vmquiet = 'my email is $!email.xxx'
      assert.equal(vm, render(vm))
      assert.equal('my email is ', render(vmquiet))
    })

    it('silence all reference', function() {
      var vm = 'my email is $email'

      var compile = new Compile(parse(vm))
      assert.equal('my email is ', compile.render(null, null, true))
    })

    it('this context keep correct, see #16', function() {
      var data = 'a = $a.get()'
      function B(c) {
        this.c = c
      }

      B.prototype.get = function() {
        var t = this.eval(" hello $name", {name: 'hanwen'})
        return this.c + t
      }

      assert.equal('a = 1 hello hanwen', render(data, {a: new B(1)}))
    })

    it('this context should keep corrent in macro', function() {
      var data = '#parse()'
      var Macro = function(name) {
        this.name = name;
      };

      Macro.prototype.parse = function() {
        return this.name;
      };

      assert.equal('hanwen', render(data, {}, new Macro('hanwen')))
    })

    it('get variable form text', function() {
      var vm = 'hello $user.getName().getFullName("hanwen")'
      var data = { '$user.getName().getFullName("hanwen")': 'world' }
      assert.equal('hello world', render(vm, data))
    })

    it('escape default', function() {
      var vm = '$name $name2 $cn $cn1'
      var data = {
        name: 'hello world',
        name2: '<i>&a',
        cn: '中文',
        cn1: '<i>中文'
      }

      var ret  = 'hello world &lt;i&gt;&amp;a 中文 &lt;i&gt;&#20013;&#25991;'
      assert.equal(ret, render(vm, data))
    })

    it('add custom ignore escape function', function() {
      var vm = '$noIgnore($name), $ignore($name)'
      var expected = '&lt;i&gt;, <i>'

      var compile = new Compile(parse(vm))
      compile.addIgnoreEscpape('ignore')

      var context = {
        name: '<i>',
        noIgnore: function(name) {
          return name
        },

        ignore: function(name) {
          return name;
        }
      }

      var ret = compile.render(context)
      assert.equal(expected, ret)
    })

    it('config support', function() {
      var vm = '$foo($name)'
      var expected = '<i>'

      var compile = new Compile(parse(vm), { escape: false })
      var context = {
        name: '<i>',
        foo: function(name) {
          return name;
        }
      }

      var ret = compile.render(context)
      assert.equal(expected, ret)

      compile = new Compile(parse(vm), { unescape: { foo: true } })
      ret = compile.render(context)
      assert.equal(expected, ret)

      compile = new Compile(parse(vm))
      ret = compile.render(context)
      assert.equal('&lt;i&gt;', ret)
    })

    it ('valueMapper support', () => {
      const values = [];
      const vm = '#set($foo = "bar")\n$foo'
      const ret = render(vm, {}, {}, {
        valueMapper: (value) => {
          values.push(value);
          return 'foo';
        },
      });
      assert.deepEqual(values, ['bar']);
      assert.equal(ret.trim(), 'foo');
    });

    describe('env', function() {
      it('should throw on property when parent is null', function() {
        var vm = '$foo.bar';
        var compile = new Compile(parse(vm), { env: 'development' })
        function foo() {
          compile.render()
        };
        foo.should.throw(/get property bar of undefined/);
      });

      it('should throw on index when parent is null', function() {
        var vm = '$foo[1]';
        var compile = new Compile(parse(vm), { env: 'development' })
        function foo() {
          compile.render()
        };
        foo.should.throw(/get property 1 of undefined/);
      });

      it('should throw on function when parent is null', function() {
        var vm = '$foo.xx()';
        var compile = new Compile(parse(vm), { env: 'development' })
        function foo() {
          compile.render()
        };
        foo.should.throw(/get property xx of undefined/);
      });

      it('should throw when mult level', function() {
        var vm = '$foo.bar.xx.bar1';
        var compile = new Compile(parse(vm), { env: 'development' })
        function foo() {
          compile.render({ foo: { bar: {} }});
        };
        foo.should.throw(/get property bar1 of undefined/);
      });

      it('not function', function() {
        var vm = '$foo.bar.xx()';
        var compile = new Compile(parse(vm), { env: 'development' })
        function foo() {
          return compile.render({ foo: { bar: {} }});
        };
        foo.should.throw(/xx is not method/);
      });
    });
  })


  describe('Literals', function() {

    it("eval string value", function() {
      var vm = '#set( $directoryRoot = "www" )' +
               '#set( $templateName = "index.vm")' +
               '#set( $template = "$directoryRoot/$templateName" )' +
               '$template'

      assert.equal('www/index.vm', render(vm))
    })

    it('not eval string', function() {
      var vm = "#set( $blargh = '$foo' )$blargh"
      assert.equal('$foo', render(vm))
    })

    it('not parse #[[ ]]#', function() {
      var vm = '#foreach ($woogie in $boogie) nothing to $woogie #end'
      assert.equal(vm, render('#[[' + vm + ']]#'))
    })

    it('Range Operator', function() {
      var vm1 = '#set($foo = [-1..2])'
      var vm2 = '#set($foo = [-1..$bar])'
      var vm3 = '#set($foo = [$bar..2])'
      assert.deepEqual([-1, 0, 1, 2], getContext(vm1).foo)
      assert.deepEqual([-1, 0, 1, 2], getContext(vm2, {bar: 2}).foo)
      assert.deepEqual([-1, 0, 1, 2], getContext(vm3, {bar: -1}).foo)
      assert.deepEqual([], getContext('#set($foo = [$bar..1])').foo)
    })

    it('map and array nest', function() {
      var vm1 = '' +
        '#set($a = [\n' +
        '  {"name": 1},\n' +
        '  {"name": 2}\n' +
        '])\n' +
        ' '

      var vm2 = '' +
        '#set($a = {\n' +
        '  "a": [1, 2, ["1", "a"], {"a": 1}],\n' +
        '  "b": "12",\n' +
        '  "d": null,\n' +
        '  "c": false\n' +
        '})\n' +
        ''

      assert.deepEqual([{name: 1}, { name: 2 }], getContext(vm1).a)
      var expected = {
        a: [1, 2, ["1", "a"], {a: 1}],
        b: "12", d: null, c: false
      };
      assert.deepEqual(expected, getContext(vm2).a)
    })
  })

  describe('Conditionals', function() {

    it('#if', function() {
      var vm = '#if($foo)Velocity#end'
      assert.equal('Velocity', render(vm, {foo: 1}))
    })

    it('#if not work', function() {
      var vm = '#if($!css_pureui)hello world#end'
      assert.equal('', render(vm))
    })

    it('#elseif & #else', function() {
      var vm = '#if($foo < 5)Go North#elseif($foo == 8)' +
      'Go East#{else}Go South#end'
      assert.equal('Go North', render(vm, {foo: 4}))
      assert.equal('Go East', render(vm, {foo: 8}))
      assert.equal('Go South', render(vm, {foo: 9}))
    })

    it('#if with arguments', function() {
      var vm = '#if($foo.isTrue(true))true#{end}'
      var foo = {
        isTrue: function(str) {
          return !!str
        }
      }

      assert.equal('true', render(vm, {foo: foo}))
    })

  })

  describe('Velocimacros', function() {

    it('simple #macro', function() {
      var vm = '#macro( d )<tr><td></td></tr>#end #d()'
      assert.equal(' <tr><td></td></tr>', render(vm))
    })

    it('compex #macro', function() {
      var vm = '#macro( d $name)<tr><td>$!name</td></tr>#end #d($foo)'
      var vm1 = '#macro( d $a $b)#if($b)$a#end#end #d ( $foo $bar )'

      assert.equal(' <tr><td>hanwen</td></tr>', render(vm, {foo: 'hanwen'}))
      assert.equal(' <tr><td></td></tr>', render(vm))
      assert.equal(' ', render(vm1, {foo: "haha"}))
      assert.equal(' ', render(vm1, {foo: "haha", bar: false}))
      assert.equal(' haha', render(vm1, {foo: "haha", bar: true}))
    })

    it('#macro call arguments', function() {
      var vm = '#macro( d $a $b $d)$a$b$!d#end #d ( $foo , $bar, $dd )'
      assert.equal(' ab', render(vm, {foo: 'a', bar: 'b'}))
      assert.equal(' abd', render(vm, {foo: 'a', bar: 'b', dd: 'd'}))
    })

    it('#macro map argument', function() {
      var vm = '#macro( d $a)#foreach($_item in $a.entrySet())' +
      '$_item.key = $_item.value #end#end #d ( {"foo": $foo,"bar":$bar} )'
      assert.equal(' foo = a bar = b ', render(vm, {foo: 'a', bar: 'b'}))
    })

    it('#noescape', function() {
      var vm = '#noescape()$hello#end'
      assert.equal('hello world', render(vm, {hello: 'hello world'}))
    })

  })

  describe('Escaping', function() {
    it('escape slash', function() {
      var vm = '#set( $email = "foo" )$email \\$email'
      assert.equal('foo $email', render(vm))
    })

    it('double slash', function() {
      var vm = '#set( $email = "foo" )\\\\$email \\\\\\$email'
      assert.equal("\\foo \\$email", render(vm))
    })

  })

  describe('Error condiction', function() {

    it('css color render', function() {
      var vm = 'color: #666 height: 39px'
      assert.equal(vm, render(vm))
    })

    it('jquery parse', function() {
      var vm = '$(function() { $("a").click() $.post() })'
      assert.equal(vm, render(vm))
    })

    it('issue #7: $ meet with #', function() {
      var vm = '$bar.foo()#if(1>0)...#end'
      assert.equal('$bar.foo()...', render(vm))
    })

    it('issue #15', function() {
      var vm = '#macro(a $b $list)' +
      '#foreach($a in $list)${a}#end $b #end #a("hello", [1, 2])'
      assert.equal(' 12 hello ', render(vm))
    })

    it('issue #18', function() {
      var vm = '$!tradeDetailModel.goodsInfoModel.goodsTitle' +
      '[<a href="$!personalModule.setTarget(\'/p.htm\')' +
      '.addQueryData("id",$!stringUtil.substringAfter' +
      '($!tradeDetailModel.goodsInfoModel.goodsId,"guarantee."))"' +
      ' target="_blank">商品页面</a>]'
      var ret = '[<a href="" target="_blank">商品页面</a>]'
      assert.equal(ret, render(vm))
    })

    it('issue #18, condiction 2', function() {
      var vm = '$!a(**** **** **** $stringUtil.right($!b,4))'
      var ret = '(**** **** **** $stringUtil.right($!b,4))'
      assert.equal(ret, render(vm))
    })

    it('# meet with css property', function() {
      var vm = '#margin-top:2px'
      assert.equal(vm, render(vm))
    })

    it('var end must in condiction var begin', function() {
      var vm = 'stepFareNo:{$!result.getStepFareNo()}'
      assert.equal('stepFareNo:{}', render(vm))
    })

    it('empty string condiction', function() {
      assert.equal('', render(''))
      assert.equal('', render('##hello'))
      assert.equal('hello', render('hello'))
    })

  })

  describe('throw friendly error message', function() {
    it('print right posiont when error throw', function() {
      var vm = '111\nsdfs\n$foo($name)'

      var compile = new Compile(parse(vm), { escape: false })
      var context = {
        name: '<i>',
        foo: function() {
          throw new Error('Run error')
        }
      }
      assert.throws(function() {
        compile.render(context)
      }, /\$foo\(\$name\)/)

      assert.throws(function() {
        compile.render(context)
      }, /Line number 3:0/)
    })

    it('print error stack of user-defined macro', function() {
      var vm = '111\n\n#foo($name)'
      var vm1 = '\nhello#parse("vm.vm")'
      var files = { 'vm.vm': vm, 'vm1.vm': vm1 };

      var compile = new Compile(parse('\n\n#parse("vm1.vm")'))
      var macros = {
        foo: function() {
          throw new Error('Run error')
        },
        parse: function(name) {
          return this.eval(files[name]);
        }
      }

      var expected = '' +
                     'Run error\n' +
                     '      at #foo($name) L/N 3:0\n' +
                     '      at #parse("vm.vm") L/N 2:5\n' +
                     '      at #parse("vm1.vm") L/N 3:0';
      try {
        compile.render({}, macros)
      } catch (e) {
        assert.equal(expected, e.message);
      }
    })
  })


  describe('self defined function', function() {

    it('$control.setTemplate', function() {

      var Control = function() {
        this.__temp = {};
      };

      Control.prototype = {
        constructor: Control,

        setTemplate: function(vm) {

          this.vm = vm;
          return this;

        },
        toString: function() {
          return this.eval(this.vm, this.__temp);
        },
        setParameter: function(key, value) {
          this.__temp[key] = value;
          return this;
        }
      };

      var str = 'hello $who, welcome to $where'

      var vm = '$control.setTemplate($str).setParameter("who", "Blob")' +
      '.setParameter("where", "China")'
      var expected = 'hello Blob, welcome to China';
      assert.equal(render(vm, {str: str, control: new Control()}), expected)

    })

  })

  describe('issues', function() {
    it('#29', function() {
      var vm = '#set($total = 0) #foreach($i in [1,2,3])' +
      ' #set($total = $total + $i) #end $total'
      assert.equal(render(vm).trim(), "6")
    })
    it('#30', function() {
      var vm = '$foo.setName'
      assert.equal(render(vm, { foo: { setName: "foo" }}).trim(), "foo")
    })
    it('#54', function() {
      var vm = '$a.b.c'
      assert.equal(render(vm, { a: { b: null }}).trim(), "$a.b.c")

      vm = '$a.b.c()'
      assert.equal(render(vm, { a: { b: null }}).trim(), "$a.b.c()")
    });
  })

  describe('multiline', function() {
    it('#set multiline', function() {
      var vm = "$bar.foo()\n#set($foo=$bar)\n..."
      assert.equal("$bar.foo()\n...", render(vm))
    })

    it('#if multiline', function() {
      var vm = "$bar.foo()\n#if(1>0)\n...#end"
      assert.equal("$bar.foo()\n...", render(vm))
    })

    it('#set #set', function() {
      var vm = "$bar.foo()\n...\n#set($foo=$bar)\n#set($foo=$bar)"
      assert.equal("$bar.foo()\n...\n", render(vm))
    })

    it('#if multiline #set', function() {
      var vm = "$bar.foo()\n#if(1>0)\n#set($foo=$bar)\n...#end"
      assert.equal("$bar.foo()\n...", render(vm))
    })

    it('#if multiline #set #end', function() {
      var vm = "$bar.foo()\n#if(1>0)...\n#set($foo=$bar)\n#end"
      assert.equal("$bar.foo()\n...\n", render(vm))
    })

    it('with references', function() {
      var vm = ['a',
                 '#foreach($b in $nums)',
                 '#if($b) ',
                 'b',
                 'e $b.alm',
                 '#end',
                 '#end',
                 'c'].join("\n");
      var expected = ['a', 'b', 'e 1', 'b', 'e 2', 'b', 'e 3', 'c'].join("\n")

      var data = {nums:[{alm:1}, {alm:2}, {alm:3}], bar:""};
      assert.equal(expected, render(vm, data))
    })

    it('multiple newlines after statement', function() {
      var vm = '#if(1>0)\n\nb#end'
      assert.equal('\nb', render(vm))
    })
  })

  describe('define support', function() {
    it('basic', function() {
      var vm = '#define($block)\nHello $who#end\n#set($who = "World!")\n$block'
      assert.equal('Hello World!', render(vm))
    })
  })

  describe('raw content render', function() {
    it('simple', function() {
      var vm = '#[[\nThis content is ignored. $val\n]]#';
      assert.equal('\nThis content is ignored. $val\n', render(vm, {
        val: 'foo'
      }));
    });

    it('newline after', function() {
      var vm = '#[[This content is ignored. $val]]#\na';
      assert.equal('This content is ignored. $val\na', render(vm, {
        val: 'foo'
      }));
    });
  });

  describe('assignment via .put', function () {
    it('should set a key to an object', function() {
      var vm = `
        #set($foo = {})
        #set($test = $foo.put('foo', 'bar'))
        $foo["foo"]
      `;
      var expected = 'bar';
      assert.equal(render(vm).trim(), expected)
    });
    it('should set a key to an object', function() {
      var vm = `
      $foo.put()
      `;
      var expected = 'bar';
      assert.equal(render(vm, {
        foo: {
          put: function() {
            return 'bar';
          }
        }
      }).trim(), expected)
    });
  });

  describe('Add into empty array', function () {
    it('should add item to array', function() {
      var vm = `
        #set($foo = [])
        #set($ignore = $foo.add('foo'))
        $foo
      `;
      var expected = '[foo]';
      assert.equal(render(vm).trim(), expected)
    });

    it('should add object to array', function() {
      var vm = `
        #set($foo = [])
        #set($ignore = $foo.add({'foo':'bar'}))
        $foo
      `;
      var expected = '[{foo=bar}]';
      assert.equal(render(vm).trim(), expected)
    });

    it('should not add when is object', function() {
      var vm = `
        #set($foo = {})
        #set($ignore = $foo.add({'foo':'bar'}))
        $foo
      `;
      var expected = '{}';
      assert.equal(render(vm).trim(), expected)
    });
  });

  describe('extracting items via .subList', function() {
    it('should return empty array if original array is empty', function() {
      var vm = `
        #set($foo = [])
        #set($bar = $foo.subList(0, 1))
        $bar
      `;
      var expected = '[]';
      assert.equal(render(vm).trim(), expected)
    });

    it('should return a single item', function() {
      var vm = `
        #set($foo = [1, 2, 3])
        #set($bar = $foo.subList(0, 1))
        $bar
      `;
      var expected = '[1]';
      assert.equal(render(vm).trim(), expected)
    });

    it('should return multiple items', function() {
      var vm = `
        #set($foo = [1, 2, 3])
        #set($bar = $foo.subList(1, 3))
        $bar
      `;
      var expected = '[2, 3]';
      assert.equal(render(vm).trim(), expected)
    });
  });

  describe('Object|Array#toString', function() {
    it('simple object', function() {
      var vm = '$data';
      var expected = '{k=v, k2=v2}';
      assert.equal(render(vm, {data: {k: "v", k2: "v2"}}), expected)
    });

    it('object.keySet()', function() {
      var vm = '$data.keySet()';
      var expected = '[k, k2]';
      assert.equal(render(vm, {data: {k: "v", k2: "v2"}}), expected)
    });

    it('object.keySet() with object that has keySet method', function() {
      var vm = '$data.keySet()';
      var expected = '[k, k2]';
      function keySet() {
        return ['k', 'k2'];
      }
      assert.equal(render(vm, {data: { keySet: keySet }}), expected)
    });

    it('object.entrySet()', function() {
      var vm = '$data.entrySet()';
      var expected = '[{key=k, value=v}, {key=k2, value=v2}]';
      assert.equal(render(vm, {data: {k: "v", k2: "v2"}}), expected)
    });

    it('object.entrySet() with object that has entrySet method', function() {
      var vm = '$data.entrySet()';
      var expected = '{k=v, k2=v2}';

      function entrySet() {
        return {
          k: "v", k2: "v2"
        }
      }

      assert.equal(render(vm, {data: { entrySet: entrySet }}), expected)
    });

    it('nested object', function() {
      var vm = '$data';
      var expected = '{k={k2=v2}, kk={k3=v3}}';
      assert.equal(render(vm, {data: {k: {k2: "v2"}, kk: {k3: "v3"}}}), expected)
    });

    it('object that has toString as own property', function() {
      var vm = '$data';
      var expected = 'custom';
      assert.equal(render(vm, {data: {toString: function() { return 'custom'; }, key: "value", key2: "value2", key3: {key4: "value4"}}}), expected)
    });

    it('simple array', function() {
      var vm = '$data';
      var expected = '[a, b]';
      assert.equal(render(vm, {data: ["a", "b"]}), expected)
    });

    it('nested array', function() {
      var vm = '$data';
      var expected = '[a, [b]]';
      assert.equal(render(vm, {data: ["a", ["b"]]}), expected)
    });

    it('object in array', function() {
      var vm = '$data';
      var expected = '[a, {k=v}]';
      assert.equal(render(vm, {data: ["a", {k: "v"}]}), expected)
    });

    it('array in object', function() {
      var vm = '$data';
      var expected = '{k=[a, b]}';
      assert.equal(render(vm, {data: {k: ["a", "b"]}}), expected)
    });
  });
})

