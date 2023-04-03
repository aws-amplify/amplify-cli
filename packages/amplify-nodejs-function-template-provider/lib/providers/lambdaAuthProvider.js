"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.provideLambdaAuth = void 0;
const constants_1 = require("../utils/constants");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const destFileMapper_1 = require("../utils/destFileMapper");
const pathToTemplateFiles = path_1.default.join(constants_1.templateRoot, 'lambda/lambda-auth');
function provideLambdaAuth() {
    const files = fs_extra_1.default.readdirSync(pathToTemplateFiles);
    return Promise.resolve({
        functionTemplate: {
            sourceRoot: pathToTemplateFiles,
            sourceFiles: files,
            defaultEditorFile: path_1.default.join('src', 'index.js'),
            destMap: (0, destFileMapper_1.getDstMap)(files),
        },
    });
}
exports.provideLambdaAuth = provideLambdaAuth;
//# sourceMappingURL=lambdaAuthProvider.js.map