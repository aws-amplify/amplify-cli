/*
 * SpiderMonkey wrapper to compress Javascript source files,
 * uses Dean Edwards (http://dean.edwards.name/packer/)
 *
 * Author: Diego Perini <diego.perini@gmail.com>
 *
 * Usage: fusecomp.js < input > output (uses stdin/stdout)
 *
 * Depends on correctly installed SpiderMonkey executable (js)
 *
 * Released under the Creative Commons license:
 * http://creativecommons.org/licenses/by/3.0/
 */

// import Dean Edwards project files
load("build/packer/base2.js");
load("build/packer/packer.js");

// read file from stdin
function _readFile(from) {
  var outstr = '', line = '';
  while ((line = readline()) != null) {
      outstr += line + '\x0a';
  }
  return outstr;
}

// read from input pack and send to output
(function minify() {
  // create new packer instance
  var packer = new Packer();
  // shrink!
  print(packer.pack(_readFile(), 0, 1, 1));
})();
