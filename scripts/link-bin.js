const lnk = require('lnk');
const cmdShim = require('@zkochan/cmd-shim');
const path = require('path');
const fs = require('fs-extra');

if (process.argv.length < 4) {
  console.log('requires 2 arguments. source and command name');
  process.exit(1);
}

const src = path.join(process.cwd(), process.argv[2]);

let dest;
if (process.argv.length === 4) {
  dest = path.join('.bin', process.argv[3]);
} else {
  dest = path.isAbsolute(process.argv[4])
    ? path.join(process.argv[4], process.argv[3])
    : path.join(process.cwd(), process.argv[4], process.argv[3]).toString();
}

if (!fs.existsSync(src)) {
  console.log(`${src} does not exits`);
  process.exit(1);
}

if (!fs.existsSync(path.dirname(dest))) {
  fs.mkdirpSync(path.dirname(dest));
}

if (process.platform === 'win32') {
  cmdShim(src, dest, (err) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
  });
} else {
  lnk.sync(src, dest, { type: 'symbolic' });
}
