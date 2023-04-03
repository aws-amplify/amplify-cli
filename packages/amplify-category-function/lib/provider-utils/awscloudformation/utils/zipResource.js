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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zipPackage = void 0;
const fs = __importStar(require("fs-extra"));
const archiver_1 = __importDefault(require("archiver"));
const zipPackage = (zipEntries, packageFileName) => {
    if (zipEntries && zipEntries.length) {
        const file = fs.createWriteStream(packageFileName);
        const zip = archiver_1.default.create('zip', {});
        return new Promise((resolve, reject) => {
            file.on('close', () => {
                resolve('Successfully zipped');
            });
            file.on('error', (err) => {
                reject(new Error(`Failed to zip with error: [${err}]`));
            });
            zip.pipe(file);
            zipEntries.forEach((entry) => {
                if (entry.sourceFolder) {
                    zip.glob('**/*', {
                        cwd: entry.sourceFolder,
                        ignore: entry.ignoreFiles,
                        dot: true,
                    });
                }
                if (entry.packageFolder) {
                    zip.directory(entry === null || entry === void 0 ? void 0 : entry.packageFolder, false);
                }
            });
            zip.finalize().catch(reject);
        });
    }
    return undefined;
};
exports.zipPackage = zipPackage;
//# sourceMappingURL=zipResource.js.map