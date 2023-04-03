"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalNodeModuleDirPath = void 0;
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const ini = __importStar(require("ini"));
const which = __importStar(require("which"));
function getGlobalNodeModuleDirPath() {
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
exports.getGlobalNodeModuleDirPath = getGlobalNodeModuleDirPath;
function getYarnPrefix() {
    const home = os.homedir();
    let yarnPrefix = path.join(home, '.config', 'yarn', 'global');
    if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
        yarnPrefix = path.join(process.env.LOCALAPPDATA, 'Yarn', 'config', 'global');
    }
    return yarnPrefix;
}
function getGlobalNpmPrefix() {
    if (process.env.PREFIX)
        return process.env.PREFIX;
    const homeDirPath = os.homedir();
    if (homeDirPath) {
        const prefix = tryConfigPath(path.resolve(homeDirPath, '.npmrc'));
        if (prefix)
            return prefix;
    }
    const npmPath = tryWhich('npm');
    if (npmPath) {
        const prefix = tryConfigPath(path.resolve(npmPath, '..', '..', 'npmrc'));
        if (prefix) {
            const globalPrefix = tryConfigPath(path.resolve(prefix, 'etc', 'npmrc')) || prefix;
            if (globalPrefix)
                return globalPrefix;
        }
    }
    const nodePath = tryWhich('node');
    if (nodePath) {
        const { APPDATA, DESTDIR, OSTYPE } = process.env;
        if (process.platform === 'win32' || OSTYPE === 'msys' || OSTYPE === 'cygwin') {
            return APPDATA ? path.join(APPDATA, 'npm') : path.dirname(nodePath);
        }
        const prefix = path.dirname(path.dirname(nodePath));
        if (DESTDIR) {
            return path.join(DESTDIR, prefix);
        }
        return prefix;
    }
    return '';
}
function tryWhich(exec) {
    try {
        return fs.realpathSync(which.sync(exec));
    }
    catch (err) {
        return undefined;
    }
}
function tryConfigPath(configPath) {
    try {
        return ini.parse(fs.readFileSync(configPath, 'utf-8')).prefix;
    }
    catch (err) {
        return undefined;
    }
}
//# sourceMappingURL=global-prefix.js.map