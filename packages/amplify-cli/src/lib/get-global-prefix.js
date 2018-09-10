const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const ini = require('ini');
const which = require('which'); 

let prefix;

function getPrefix() {
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

      if (!prefix) fallback();
    }
  }

  if (prefix) {
    return expand(prefix);
  }
}

function fallback() {
  if (/^win/.test(process.platform)) {
    prefix = process.env.APPDATA
      ? path.join(process.env.APPDATA, 'npm')
      : path.dirname(process.execPath);
  } else {
    prefix = path.dirname(path.dirname(process.execPath));
    if (process.env.DESTDIR) {
      prefix = path.join(process.env.DESTDIR, prefix);
    }
  }
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

module.exports = getPrefix();
