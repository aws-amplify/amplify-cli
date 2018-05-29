/*
 * SpiderMonkey/V8 wrapper to test NWSAPI selector engine
 *
 * Author: Diego Perini <diego.perini@gmail.com>
 *
 * Usage: load_test.js < input > output (uses stdin/stdout)
 *
 * Depends on correctly installed SpiderMonkey executable (js)
 *
 * Released under the Creative Commons license:
 * http://creativecommons.org/licenses/by/3.0/
 */

// import Chris Tatcher env.js
// since a DOM layer is needed
load("test/jsvm/env.js");
load("dist/nwsapi.js");

// read file from stdin using SM or V8 style
var _readFile = typeof this.read == 'function' ?
  function() {
    return read('/dev/stdin');
  } : typeof this.readline == 'function' ?
  function() {
    var outstr = '', line = '';
    while ((line = readline()) != null) {
        outstr += line + '\x0a';
    }
    return outstr;
  } :
  function() {
    return '';
  };

// read from standard input output to document
(function(global) {

  var doc = global.document, results;

  doc.open('text/html', 'replace');
  doc.write(_readFile());
  doc.close();

  print();
  
  print('\nSelection Test - negation/emptiness "#test1 div:not(:empty)"\n');

  results = NW.Dom.select('#test1 div:not(:empty)', doc,
    function(element) {
      print(element.nodeName);
    });

  print('\n' + results.length + ' elements found.');

  print('\nSelection Test - structural pseudos "#test1 div:nth-child(even):empty"\n');

  results = NW.Dom.select('#test1 div:nth-child(even):empty', doc,
    function(element) {
      print(element.nodeName);
    });

  print('\n' + results.length + ' elements found.');

  print();

})(this);
