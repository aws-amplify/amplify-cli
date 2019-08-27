/// <reference path="../index.d.ts" />
import * as Velocity from 'velocityjs'

Velocity.render('hello world');

const compiler = new Velocity.Compile(Velocity.parse('hello world'), {
  valueMapper(value) {
    console.log(value);
    return value;
  },
});
const str = compiler.render({}, {}, true)
console.log(compiler.cost)