import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as ini from 'ini';
import * as which from 'which';

export function getGlobalNodeModuleDirPath() {
  const yarnPrefix = getYarnPrefix();
  if (__dirname.includes(yarnPrefix)) {
    return path.join(yarnPrefix, 'node_modules');
  }

  const globalNpmPrefix = getGlobalNpmPrefix();
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

// NOTE: This issue: https://github.com/jonschlinkert/global-prefix/issues/30 prevents us from using the global-prefix package
function getGlobalNpmPrefix() {
  // System-wide prefix
  if (process.env.PREFIX) return process.env.PREFIX;

  // $HOME variable
  const homeDirPath = os.homedir();
  if (homeDirPath) {
    const prefix = tryConfigPath(path.resolve(homeDirPath, '.npmrc'));
    if (prefix) return prefix;
  }

  // Find global NPM path
  const npmPath = tryWhich('npm');
  if (npmPath) {
    // Check the built-in npm config file
    const prefix = tryConfigPath(path.resolve(npmPath, '..', '..', 'npmrc'));
    if (prefix) {
      // Custom npm config ?
      const globalPrefix = tryConfigPath(path.resolve(prefix, 'etc', 'npmrc')) || prefix;
      if (globalPrefix) return globalPrefix;
    }
  }

  const nodePath = tryWhich('node') // Search for Node's global executable
  if (nodePath) {
    const { APPDATA, DESTDIR, OSTYPE } = process.env;

    // Windows
    // c:\node\node.exe --> prefix=c:\node\
    if (process.platform === 'win32' || OSTYPE === 'msys' || OSTYPE === 'cygwin') {
      return APPDATA ? path.join(APPDATA, 'npm') : path.dirname(nodePath);
    }

    // UNIX
    // /usr/local/bin/node --> prefix=/usr/local
    const prefix = path.dirname(path.dirname(nodePath));
    if (DESTDIR) {
      return path.join(DESTDIR, prefix);
    }

    return prefix;
  }

  return '';
}

function tryWhich(exec): string | undefined {
  try {
    return fs.realpathSync(which.sync(exec));
  } catch (err) {
    return undefined;
  }
}

function tryConfigPath(configPath): string | undefined {
  try {
    return ini.parse(fs.readFileSync(configPath, 'utf-8')).prefix;
  } catch (err) {
    return undefined;
  }
}
