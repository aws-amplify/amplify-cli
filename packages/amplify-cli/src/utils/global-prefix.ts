import os from 'os';
import path from 'path';
import globalNpmPrefix from 'global-prefix';

export function getGlobalNodeModuleDirPath() {
  const yarnPrefix = getYarnPrefix();
  if (__dirname.includes(yarnPrefix)) {
    return path.join(yarnPrefix, 'node_modules');
  }
  if (process.platform === 'win32') {
    return path.join(globalNpmPrefix, 'node_modules');
  }
  return path.join(globalNpmPrefix, 'lib', 'node_modules');
}

function getYarnPrefix() {
  const home = os.homedir();
  let yarnPrefix = path.join(home, '.config', 'yarn', 'global');
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    yarnPrefix = path.join(process.env.LOCALAPPDATA, 'Yarn', 'config', 'global');
  }
  return yarnPrefix;
}
