"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUiBuilderComponentsPath = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const extractArgs_1 = require("./extractArgs");
const getUiBuilderComponentsPath = (context) => {
    const args = (0, extractArgs_1.extractArgs)(context);
    const srcDir = args.srcDir ? args.srcDir : context.exeInfo.projectConfig.javascript.config.SourceDir;
    const uiBuilderComponentsPath = path_1.default.resolve(path_1.default.join('.', srcDir, 'ui-components'));
    if (!fs_extra_1.default.existsSync(uiBuilderComponentsPath)) {
        fs_extra_1.default.mkdirpSync(uiBuilderComponentsPath);
    }
    return uiBuilderComponentsPath;
};
exports.getUiBuilderComponentsPath = getUiBuilderComponentsPath;
//# sourceMappingURL=getUiBuilderComponentsPath.js.map