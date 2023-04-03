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
exports.getLogDirectory = exports.getLocalLogFileDirectory = void 0;
const path = __importStar(require("path"));
const constants_1 = require("./constants");
const os = __importStar(require("os"));
function getFolder() {
    let folder = constants_1.constants.LOG_DIRECTORY;
    if (process.argv.length > 1) {
        const executable = process.argv[1];
        if (executable && executable.includes('dev')) {
            folder += '-dev';
        }
    }
    return folder;
}
function getLocalLogFileDirectory(projectPath) {
    return path.join(projectPath, constants_1.constants.LOG_DIRECTORY);
}
exports.getLocalLogFileDirectory = getLocalLogFileDirectory;
function getLogDirectory() {
    return path.join(os.homedir(), constants_1.constants.DOT_AMPLIFY, getFolder());
}
exports.getLogDirectory = getLogDirectory;
//# sourceMappingURL=baseLogFilePath.js.map