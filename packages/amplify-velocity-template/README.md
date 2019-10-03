Velocity - Template Engine
==========================


[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![npm download][download-image]][download-url]

[npm-image]: http://img.shields.io/npm/v/velocityjs.svg?style=flat-square
[npm-url]: http://npmjs.org/package/velocityjs
[download-image]: https://img.shields.io/npm/dm/velocityjs.svg?style=flat-square
[download-url]: https://npmjs.org/package/velocityjs
[travis-image]: https://img.shields.io/travis/shepherdwind/velocity.js/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/shepherdwind/velocity.js
[coveralls-image]: https://img.shields.io/coveralls/shepherdwind/velocity.js.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/shepherdwind/velocity.js?branch=master


Velocityjs is [velocity](http://velocity.apache.org/) template engine for javascript.

[中文版文档](./README-cn.md)

## Features

- Supports both client and server side use.
- Separation of parsing and rendering templates.
- The basic syntax is fully supported all java version velocity.
- [Vim Syntax](https://github.com/shepherdwind/vim-velocity) for vim.

## Install

via npm:

```bash
$ npm install velocityjs
```

## Browser

Compatible with all modern browsers. You can try [test case](http://git.shepherdwind.com/velocity.js/runner/tests.html) in your browser to test it.

For other lower version browsers, you need have those polyfill function.

1. Array.prototype map, forEach, some, filter, every, indexOf
2. Date.now
3. Object.keys

## Examples

You can find a lot of examples from the tests directory. There is no different between the use of browser and NodeJs.

## Public API

```
{
  // render method
  render(vm: string, context?: Object, macros?: Object): string;

  parse(vm: string, config?: Object, ignorespace?: boolean): Array<Ast>;

  Compile: {
    (asts: Array<Ast>, config?: Object): {
      render(context?: Object, macros?: Object);
    };
  };
}
```

### render

params:

- vm {string} velocity string input
- context {object} render context, data or function for vm
- macros {object} such as `#include('path/xxx')` , you can define you `inlcude` macro function

```js
var Velocity = require('velocityjs');

Velocity.render('string of velocity', context, macros);
```

#### context

`context` is an object or undefined, for vm `$foo.bar`, data look up path will be `context.foo.bar`.
`context` can have method, and call it just on velocity string.

The method of context, will have `eval` method on `this` of inner method body. You can `eval` to rerender velocity string, such as test code [$control.setTemplate](https://github.com/shepherdwind/velocity.js/blob/master/tests/compile.js#L532).


### Compile and parse

`parse` method can parse vm, and return ast tree of velocity.

`Compile` will render asts to result string.

```
var Compile = Velocity.Compile;

var asts = Velocity.parse('string of velocity');
(new Compile(asts)).render(context, macros);
```

#### Compile

params:

- asts {array} array of vm asts tree
- config {object} you can define some option for Compile

##### config

- escape {boolean} default `true`, default escape variable to html encode, you can set false to close it.
- unescape {object} define the object, which key do not need escape. For example, set unescape equal `{control: true}`, so `$control.html` will not escape.
- env {string} when env equal `development` will throw error when null values are used
- valueMapper {function} this config allow us to redefine the `#set` value, @see https://github.com/shepherdwind/velocity.js/pull/105

#### parse

params:

- vm {string} string to parse
- blocks {object} self define blocks, such as `#cms(1) hello #end`, you can set `{cms: true}`
- ignorespace {boolean} if set true, then ignore the newline trim.

## Syntax

Syntax you can find from [velocity user guide](http://velocity.apache.org/engine/devel/user-guide.html)。

### Directives

Directives supports have `set`, `foreach`, `if|else|elseif`, `macro`, `break`, `stop`, `return`.

Some othe directive `evaluate`, `define`, `parse`, do not supported default, but You can realize by context or macros, for example [parse](https://github.com/shepherdwind/velocity.js/blob/master/tests/compile.js#L627)

## Questions

You can find help from those ways:

1. New [issue](https://github.com/shepherdwind/velocity.js/issues/new)
2. Email to eward.song at gmail.com
3. 阿里内部员工，可以通过 hanwen.sah 搜到我的旺旺

## Other

Recommend an other [velocity](https://github.com/fool2fish/velocity).

## License

(The MIT License)
