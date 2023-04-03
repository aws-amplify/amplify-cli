"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyOverride = void 0;
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const copyOverride = () => {
    if (!fs_1.default.copyFile)
        return;
    const path = require('path');
    const originalCopyFile = fs_1.default.copyFile;
    const originalCopyFileSync = fs_1.default.copyFileSync;
    const isBundled = RegExp.prototype.test.bind(/^(?:\/snapshot\/|[A-Z]+:\\snapshot\\)/);
    fs_1.default.copyFile = ((src, dest, flags, callback) => {
        if (!isBundled(path.resolve(src))) {
            return originalCopyFile(src, dest, flags, callback);
        }
        if (typeof flags === 'function') {
            callback = flags;
            flags = 0;
        }
        else if (typeof callback !== 'function') {
            throw new TypeError('Callback must be a function');
        }
        fs_1.default.readFile(src, (readError, content) => {
            if (readError) {
                callback(readError);
                return;
            }
            if (flags & fs_1.default.constants.COPYFILE_EXCL) {
                fs_1.default.stat(dest, (statError) => {
                    if (!statError) {
                        callback(Object.assign(new Error('File already exists'), { code: 'EEXIST' }));
                        return;
                    }
                    if (statError.code !== 'ENOENT') {
                        callback(statError);
                        return;
                    }
                    fs_1.default.writeFile(dest, content, callback);
                });
            }
            else {
                fs_1.default.writeFile(dest, content, callback);
            }
        });
        return undefined;
    });
    fs_1.default.copyFileSync = (src, dest, flags) => {
        if (!isBundled(path.resolve(src))) {
            originalCopyFileSync(src, dest, flags);
            return;
        }
        const content = fs_1.default.readFileSync(src);
        if (flags & fs_1.default.constants.COPYFILE_EXCL) {
            try {
                fs_1.default.statSync(dest);
            }
            catch (statError) {
                if (statError.code !== 'ENOENT')
                    throw statError;
                fs_1.default.writeFileSync(dest, content);
                return;
            }
            throw Object.assign(new Error('File already exists'), { code: 'EEXIST' });
        }
        fs_1.default.writeFileSync(dest, content);
    };
    if (!fs_1.default.promises)
        return;
    fs_1.default.promises.copyFile = (0, util_1.promisify)(fs_1.default.copyFile);
};
exports.copyOverride = copyOverride;
//# sourceMappingURL=copy-override.js.map