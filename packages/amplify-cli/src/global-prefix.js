const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const ini = require('ini');
const which = require('which');

function getGlobalNodeModuleDirPath() {
  const yarnPrefix = getYarnPrefix();
  if (__dirname.includes(yarnPrefix)) {
    return path.join(yarnPrefix, 'node_modules');
  }
  if (process.platform === 'win32') {
    return path.join(getNpmPrefix(), 'node_modules');
  }
  return path.join(getNpmPrefix(), 'lib', 'node_modules');
}

function getYarnPrefix() {
  const home = os.homedir();

  let yarnPrefix = path.join(home, '.config', 'yarn', 'global');
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    yarnPrefix = path.join(process.env.LOCALAPPDATA, 'Yarn', 'config', 'global');
  }

  return yarnPrefix;
}

function getNpmPrefix() {
  let prefix;
  if (process.env.PREFIX) {
    prefix = process.env.PREFIX;
  } else {
    const home = os.homedir();
    if (home) {
      const userConfig = path.resolve(home, '.npmrc');
      prefix = tryConfigPath(userConfig);
    }

    if (!prefix) {
      const npm = tryNpmPath();
      if (npm) {
        const builtinConfig = path.resolve(npm, '..', '..', 'npmrc');
        prefix = tryConfigPath(builtinConfig);

        if (prefix) {
          const globalConfig = path.resolve(prefix, 'etc', 'npmrc');
          prefix = tryConfigPath(globalConfig) || prefix;
        }
      }

      if (!prefix) {
        prefix = fallback();
      }
    }
  }

  if (prefix) {
    return expand(prefix);
  }
}

function fallback() {
  let result;
  if (/^win/.test(process.platform)) {
    result = process.env.APPDATA ? path.join(process.env.APPDATA, 'npm') : path.dirname(process.execPath);
  } else {
    result = path.dirname(path.dirname(process.execPath));
    if (process.env.DESTDIR) {
      result = path.join(process.env.DESTDIR, result);
    }
  }
  return result;
}

function tryNpmPath() {
  let result;
  try {
    result = fs.realpathSync(which.sync('npm'));
  } catch (err) {
    result = undefined;
  }
  return result;
}

function tryConfigPath(configPath) {
  let result;
  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    const config = ini.parse(data);
    if (config.prefix) {
      result = config.prefix;
    }
  } catch (err) {
    result = undefined;
  }
  return result;
}

function expand(filePath) {
  const home = os.homedir();
  if (filePath.charCodeAt(0) === 126 /* ~ */) {
    if (filePath.charCodeAt(1) === 43 /* + */) {
      return path.join(process.cwd(), filePath.slice(2));
    }
    return home ? path.join(home, filePath.slice(1)) : filePath;
  }
  return filePath;
}

module.exports = { getGlobalNodeModuleDirPath };
