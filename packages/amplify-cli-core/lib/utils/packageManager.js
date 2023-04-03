"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
exports.getPackageManager = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const which = __importStar(require("which"));
const packageJson = 'package.json';
const isWindows = process.platform === 'win32';
const packageManagers = {
    npm: {
        packageManager: 'npm',
        lockFile: 'package-lock.json',
        executable: isWindows ? 'npm.cmd' : 'npm',
    },
    yarn: {
        packageManager: 'yarn',
        lockFile: 'yarn.lock',
        executable: isWindows ? 'yarn.cmd' : 'yarn',
    },
    yarn2: {
        packageManager: 'yarn',
        lockFile: 'yarn.lock',
        executable: isWindows ? 'yarn.cmd' : 'yarn',
        yarnrcPath: '.yarnrc.yml',
    },
};
const getPackageManager = (rootPath) => {
    const effectiveRootPath = rootPath !== null && rootPath !== void 0 ? rootPath : process.cwd();
    const checkExecutable = (executable) => which.sync(executable, { nothrow: true });
    let tempFilePath = path.join(effectiveRootPath, packageJson);
    if (!fs.existsSync(tempFilePath)) {
        return null;
    }
    tempFilePath = path.join(effectiveRootPath, packageManagers.yarn.lockFile);
    if (packageManagers.yarn2.yarnrcPath !== undefined) {
        const yarnRcFilePath = path.join(effectiveRootPath, packageManagers.yarn2.yarnrcPath);
        if (fs.existsSync(tempFilePath) && checkExecutable(packageManagers.yarn.executable) && fs.existsSync(yarnRcFilePath)) {
            return packageManagers.yarn2;
        }
    }
    if (fs.existsSync(tempFilePath) && checkExecutable(packageManagers.yarn.executable)) {
        return packageManagers.yarn;
    }
    tempFilePath = path.join(effectiveRootPath, packageManagers.npm.lockFile);
    if (fs.existsSync(tempFilePath)) {
        return packageManagers.npm;
    }
    if (packageManagers.yarn2.yarnrcPath !== undefined) {
        const yarnRcFilePath = path.join(effectiveRootPath, packageManagers.yarn2.yarnrcPath);
        if (fs.existsSync(yarnRcFilePath) && checkExecutable(packageManagers.yarn.executable)) {
            return packageManagers.yarn2;
        }
    }
    if (checkExecutable(packageManagers.yarn.executable)) {
        return packageManagers.yarn;
    }
    return packageManagers.npm;
};
exports.getPackageManager = getPackageManager;
//# sourceMappingURL=packageManager.js.map