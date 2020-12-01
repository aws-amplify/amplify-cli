const execa = require('execa');
const path = require('path');

const isWin = process.platform.startsWith('win');
const amplify = isWin ? 'amplify.cmd' : 'amplify';
const amplifyDev = isWin ? 'amplify-dev.cmd' : 'amplify-dev';

const defaultOpts = {
  inheritIO: true,
};

const callPkgAmplifyWin = async (args, opts) => {
  opts = { ...defaultOpts, ...opts };
  const { stdout, stderr } = await execa.command(`cmd /V /C "set PKG_EXECPATH= && ${process.argv[0]} ${args.join(' ')}"`, {
    stdio: opts.inheritIO ? 'inherit' : undefined,
    shell: 'cmd.exe',
  });
  if (stderr) {
    throw new Error(`Amplify failed due to ${stderr}`);
  }
  return stdout;
};

const callPkgAmplifyNix = async (args, opts) => {
  opts = { ...defaultOpts, ...opts };
  const { stdout, stderr } = await execa.command(`PKG_EXECPATH=; ${process.argv[0]} ${args.join(' ')}`, {
    stdio: opts.inheritIO ? 'inherit' : undefined,
    shell: 'bash',
  });
  if (stderr) {
    throw new Error(`Amplify failed due to ${stderr}`);
  }
  return stdout;
};

const callNodeAmplify = async (args, opts) => {
  opts = { ...defaultOpts, ...opts };
  const amplifyCmd = path.basename(process.argv[1]) === 'amplify-app-dev' ? amplifyDev : amplify;
  const { stdout, stderr } = await execa(amplifyCmd, args, { stdio: opts.inheritIO ? 'inherit' : undefined });
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
