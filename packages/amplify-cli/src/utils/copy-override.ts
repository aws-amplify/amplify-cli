import fs from 'fs';
import { promisify } from 'util';
// Workaround 'pkg' bug: https://github.com/zeit/pkg/issues/420
// Copying files from snapshot via `fs.copyFileSync` crashes with ENOENT
// Overriding copyFileSync with primitive alternative
//
// Copied from https://github.com/serverless/serverless/blob/94ff3b22ab13afc60fb4e672520b4db527ee0432/lib/utils/standalone-patch.js
// with minimal modification to work in TS
export const copyOverride = () => {
  if (!fs.copyFile) return;

  const path = require('path');

  const originalCopyFile = fs.copyFile;
  const originalCopyFileSync = fs.copyFileSync;

  const isBundled = RegExp.prototype.test.bind(/^(?:\/snapshot\/|[A-Z]+:\\snapshot\\)/);

  fs.copyFile = ((src, dest, flags, callback) => {
    if (!isBundled(path.resolve(src))) {
      return originalCopyFile(src, dest, flags, callback);
    }
    if (typeof flags === 'function') {
      callback = flags;
      flags = 0;
    } else if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    fs.readFile(src, (readError, content) => {
      if (readError) {
        callback(readError);
        return;
      }
      // eslint-disable-next-line no-bitwise
      if (flags & fs.constants.COPYFILE_EXCL) {
        fs.stat(dest, statError => {
          if (!statError) {
            callback(Object.assign(new Error('File already exists'), { code: 'EEXIST' }));
            return;
          }
          if (statError.code !== 'ENOENT') {
            callback(statError);
            return;
          }
          fs.writeFile(dest, content, callback);
        });
      } else {
        fs.writeFile(dest, content, callback);
      }
    });
    return undefined;
  }) as any;

  fs.copyFileSync = (src, dest, flags) => {
    if (!isBundled(path.resolve(src))) {
      originalCopyFileSync(src, dest, flags);
      return;
    }
    const content = fs.readFileSync(src);
    // eslint-disable-next-line no-bitwise
    if (flags! & fs.constants.COPYFILE_EXCL) {
      try {
        fs.statSync(dest);
      } catch (statError) {
        if (statError.code !== 'ENOENT') throw statError;
        fs.writeFileSync(dest, content);
        return;
      }
      throw Object.assign(new Error('File already exists'), { code: 'EEXIST' });
    }
    fs.writeFileSync(dest, content);
  };

  if (!fs.promises) return;

  fs.promises.copyFile = promisify(fs.copyFile);
};
