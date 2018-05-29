const { JSDOM } = require("jsdom");

let jsdom = new JSDOM();

let parser = new jsdom.window.DOMParser();
let string = `<?xml version="1.0"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title></dc:title></cp:coreProperties>`;

let dom = parser.parseFromString(string, 'text/xml');
let el = dom.querySelectorAll('coreProperties');

if (el.length === 1) {
  console.log('Passed!');
} else {
  console.log('Failed!');
}

console.log(el);
