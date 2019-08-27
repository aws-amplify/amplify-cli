'use strict';
var path = require('path');
var fs = require('fs');
var files = fs.readdirSync(path.join(__dirname, '../'));

var ret = '';

files.forEach(function(file) {
  if (path.extname(file) !==  '.js') {
    return;
  }

  var str = fs.readFileSync(path.join(__dirname, "../", file));
  ret += str.toString().replace(/^[\S\s]*?describe/, 'describe');
});

fs.writeFileSync(path.join(__dirname, "../runner/spec.js"), ret);
var json = require('../../package.json');

synsVersion();

function synsVersion(){
  var pathname = path.join(__dirname, '../runner/tests.html');
  var html = fs.readFileSync(pathname);
  html = html.toString()
    .replace(/(velocityjs\/)\d+\.\d+\.\d+/, '$1' + json.version);

  fs.writeFileSync(pathname, html);
  console.log('sync version to %s', json.version);
}
console.log('sync runner success!');
