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
exports.validateExportDirectoryPath = void 0;
const fs = __importStar(require("fs-extra"));
const errors_1 = require("../errors");
const path = __importStar(require("path"));
function validateExportDirectoryPath(directoryPath, defaultPath) {
    const exportPath = directoryPath || defaultPath;
    const resolvedDir = path.resolve(exportPath);
    if (!fs.existsSync(resolvedDir)) {
        fs.ensureDirSync(resolvedDir);
    }
    else {
        const stat = fs.lstatSync(exportPath);
        if (!stat.isDirectory()) {
            throw new errors_1.ExportPathValidationError(`${exportPath} is not a valid directory`);
        }
    }
    return resolvedDir;
}
exports.validateExportDirectoryPath = validateExportDirectoryPath;
//# sourceMappingURL=validate-path.js.map