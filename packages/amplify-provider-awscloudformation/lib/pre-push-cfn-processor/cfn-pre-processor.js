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
exports.writeCustomPoliciesToCFNTemplate = exports.preProcessCFNTemplate = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const path = __importStar(require("path"));
const constants_1 = require("../constants");
const pre_push_cfn_modifier_1 = require("./pre-push-cfn-modifier");
const buildDir = 'build';
const preProcessCFNTemplate = async (filePath, options) => {
    const { templateFormat, cfnTemplate } = (0, amplify_cli_core_1.readCFNTemplate)(filePath);
    await (0, pre_push_cfn_modifier_1.prePushCfnTemplateModifier)(cfnTemplate);
    const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
    const pathSuffix = filePath.startsWith(backendDir) ? filePath.slice(backendDir.length) : path.parse(filePath).base;
    const newPath = path.join(backendDir, constants_1.ProviderName, buildDir, pathSuffix);
    await (0, amplify_cli_core_1.writeCFNTemplate)(cfnTemplate, newPath, { templateFormat, minify: options === null || options === void 0 ? void 0 : options.minify });
    return newPath;
};
exports.preProcessCFNTemplate = preProcessCFNTemplate;
const writeCustomPoliciesToCFNTemplate = async (resourceName, service, cfnFile, category, options) => {
    if (!(category === 'api' && service === 'ElasticContainer') && !(category === 'function' && service === 'Lambda')) {
        return;
    }
    const resourceDir = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, category, resourceName);
    const cfnPath = path.join(resourceDir, cfnFile);
    const { templateFormat, cfnTemplate } = (0, amplify_cli_core_1.readCFNTemplate)(cfnPath);
    const newCfnTemplate = (0, amplify_cli_core_1.generateCustomPoliciesInTemplate)(cfnTemplate, resourceName, service, category);
    await (0, amplify_cli_core_1.writeCFNTemplate)(newCfnTemplate, cfnPath, { templateFormat, minify: options === null || options === void 0 ? void 0 : options.minify });
};
exports.writeCustomPoliciesToCFNTemplate = writeCustomPoliciesToCFNTemplate;
//# sourceMappingURL=cfn-pre-processor.js.map