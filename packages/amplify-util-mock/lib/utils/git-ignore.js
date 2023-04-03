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
exports.addMockAPIResourcesToGitIgnore = exports.addMockDataToGitIgnore = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const mock_directory_1 = require("./mock-directory");
function addMockDataToGitIgnore(context) {
    addMockDirectoryToGitIgnore(context, (0, mock_directory_1.getMockDataDirectory)(context));
}
exports.addMockDataToGitIgnore = addMockDataToGitIgnore;
function addMockAPIResourcesToGitIgnore(context) {
    addMockDirectoryToGitIgnore(context, (0, mock_directory_1.getMockAPIResourceDirectory)(context));
}
exports.addMockAPIResourcesToGitIgnore = addMockAPIResourcesToGitIgnore;
function addMockDirectoryToGitIgnore(context, directory) {
    const gitIgnoreFilePath = context.amplify.pathManager.getGitIgnoreFilePath();
    if (fs.existsSync(gitIgnoreFilePath)) {
        const gitRoot = path.dirname(gitIgnoreFilePath);
        const directoryRelativeToGitRoot = path.relative(gitRoot, directory).replace(/\\/g, '/');
        let gitIgnoreContent = fs.readFileSync(gitIgnoreFilePath).toString();
        if (gitIgnoreContent.search(RegExp(`^\\s*${directoryRelativeToGitRoot}\\w*$`, 'gm')) === -1) {
            gitIgnoreContent += '\n' + directoryRelativeToGitRoot;
            fs.writeFileSync(gitIgnoreFilePath, gitIgnoreContent);
        }
    }
}
//# sourceMappingURL=git-ignore.js.map