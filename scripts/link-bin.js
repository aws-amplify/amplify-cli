const lnk = require('lnk');
const cmdShim = require('cmd-shim');
const path = require('path');
const fs = require('fs-extra');
const childProcess = require('child_process');

if (process.argv.length < 3) {
  console.log('requires 1 arguments. source');
  process.exit(1);
}

const src = path.join(process.cwd(), process.argv[2]);
let dest;
if (process.argv.length === 3) {
  const yarnGlobalBin = childProcess
    .execSync('yarn global bin')
    .toString()
    .trim();
  dest = path.join(yarnGlobalBin, 'amplify-dev');
} else {
  dest = path.isAbsolute(process.argv[3]) ? process.argv[3] : path.join(process.cwd(), process.argv[3]).toString();
}

if (!fs.existsSync(src)) {
  console.log(`${src} does not exits`);
  process.exit(1);
}

if (!fs.existsSync(path.dirname(dest))) {
  fs.mkdirpSync(path.dirname(dest));
}

if (process.platform === 'win32') {
  cmdShim(src, dest, err => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
  });
} else {
  lnk.sync(src, dest, { type: 'symbolic' });
}
