const { JSDOM } = require("jsdom");

let jsdom = new JSDOM('<!doctype html><svg xlink:href="foo"/>');
let dom = jsdom.window.document;

let el = dom.querySelectorAll('[*|href]');

if (el.length === 1) {
  console.log('Passed!');
} else {
  console.log('Failed!');
}

console.log(el);

el = dom.querySelectorAll('[xlink:href=foo]');

console.log(el);
