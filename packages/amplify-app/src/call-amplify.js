const execa = require('execa');
const path = require('path');

const isWin = process.platform.startsWith('win');
const amplify = isWin ? 'amplify.cmd' : 'amplify';
const amplifyDev = isWin ? 'amplify-dev.cmd' : 'amplify-dev';

const callPkgAmplifyWin = async args => {
  const { stdout, stderr } = await execa.command(`cmd /V /C "set PKG_EXECPATH= && ${process.argv[0]} ${args.join(' ')}"`, {
    stdio: 'inherit',
    shell: 'cmd.exe',
  });
  if (stderr) {
    throw new Error(`Amplify failed due to ${stderr}`);
  }
  return stdout;
};

const callPkgAmplifyNix = async args => {
  const { stdout, stderr } = await execa.command(`PKG_EXECPATH=; ${process.argv[0]} ${args.join(' ')}`, {
    stdio: 'inherit',
    shell: 'bash',
  });
  if (stderr) {
    throw new Error(`Amplify failed due to ${stderr}`);
  }
  return stdout;
};

const callNodeAmplify = async args => {
  const amplifyCmd = path.basename(process.argv[1]) === 'amplify-app-dev' ? amplifyDev : amplify;
  const { stdout, stderr } = await execa(amplifyCmd, args, { stdio: 'inherit' });
  if (stderr) {
    throw new Error(`Amplify failed due to ${stderr}`);
  }
  return stdout;
};

const callPkgAmplify = isWin ? callPkgAmplifyWin : callPkgAmplifyNix;

const callAmplify = !!process.pkg ? callPkgAmplify : callNodeAmplify;

module.exports = {
  callAmplify,
};
