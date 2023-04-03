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
exports.minifyAllJSONInFolderRecursively = exports.minifyJSONFile = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const minifyJSONFile = (jsonFilePath) => {
    if (!jsonFilePath.includes('.json'))
        return;
    const originalJSON = fs.readFileSync(jsonFilePath, 'utf-8');
    const minifiedJSON = JSON.stringify(JSON.parse(originalJSON));
    fs.writeFileSync(jsonFilePath, minifiedJSON);
};
exports.minifyJSONFile = minifyJSONFile;
const minifyAllJSONInFolderRecursively = (rootPath) => {
    fs.readdirSync(rootPath).forEach((childHandle) => {
        const childPath = path.join(rootPath, childHandle);
        if (fs.lstatSync(childPath).isDirectory())
            (0, exports.minifyAllJSONInFolderRecursively)(childPath);
        if (fs.lstatSync(childPath).isFile() && childPath.includes('.json'))
            (0, exports.minifyJSONFile)(childPath);
    });
};
exports.minifyAllJSONInFolderRecursively = minifyAllJSONInFolderRecursively;
//# sourceMappingURL=minify-json.js.map