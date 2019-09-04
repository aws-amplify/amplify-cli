const fs = require('fs-extra');
const path = require('path');
const childProcess = require('child_process');

const cliBinFolder = path.join(__dirname, 'packages', 'amplify-cli', 'bin');

const binPath = childProcess.spawnSync()

const amplifyDev = path.join(binPath, 'amplify-dev');
if(fs.existsSync(amplifyDev)) {
  fs.unlinkSync(amplifyDev);
  fs.symlinkSync(amplifyDev, path.join(cliBinFolder, 'amplify'));
}

if(process.platform === 'win32') {
  const amplifyDevCmd = path.join(binPath, 'amplify-dev.cmd');
  if(fs.existsSync(amplifyDevCmd)) {
    fs.unlinkSync(amplifyDevCmd);
    fs.symlinkSync(amplifyDevCmd, path.join(cliBinFolder, 'amplify-dev.cmd'));
  }
}
