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
exports.getDefaultTemplateDescription = exports.setDefaultTemplateDescription = exports.prePushTemplateDescriptionHandler = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const push_resources_1 = require("./push-resources");
var DeploymentTypes;
(function (DeploymentTypes) {
    DeploymentTypes["AMPLIFY_CLI"] = "Amplify";
    DeploymentTypes["AMPLIFY_ADMIN"] = "AmplifyAdmin";
})(DeploymentTypes || (DeploymentTypes = {}));
var SupportedPlatforms;
(function (SupportedPlatforms) {
    SupportedPlatforms["WINDOWS"] = "Windows";
    SupportedPlatforms["MAC"] = "Mac";
    SupportedPlatforms["LINUX"] = "Linux";
    SupportedPlatforms["OTHER"] = "Other";
})(SupportedPlatforms || (SupportedPlatforms = {}));
async function prePushTemplateDescriptionHandler(context, resourcesToBeCreated) {
    const promises = [];
    for (const { category, resourceName, service } of resourcesToBeCreated) {
        const { resourceDir, cfnFiles } = (0, push_resources_1.getCfnFiles)(category, resourceName);
        for (const cfnFile of cfnFiles) {
            const cfnFilePath = path.resolve(path.join(resourceDir, cfnFile));
            promises.push(await setDefaultTemplateDescription(context, category, resourceName, service, cfnFilePath));
        }
    }
    await Promise.all(promises);
}
exports.prePushTemplateDescriptionHandler = prePushTemplateDescriptionHandler;
async function setDefaultTemplateDescription(context, category, resourceName, service, cfnFilePath) {
    var _a;
    const { templateFormat, cfnTemplate } = (0, amplify_cli_core_1.readCFNTemplate)(cfnFilePath);
    cfnTemplate.Description = getDefaultTemplateDescription(context, category, service);
    await (0, amplify_cli_core_1.writeCFNTemplate)(cfnTemplate, cfnFilePath, { templateFormat, minify: (_a = context.input.options) === null || _a === void 0 ? void 0 : _a.minify });
}
exports.setDefaultTemplateDescription = setDefaultTemplateDescription;
function getDefaultTemplateDescription(context, category, service) {
    let platformDescription;
    let deploymentTypeDescription;
    const platform = os.platform();
    if (platform == 'darwin') {
        platformDescription = SupportedPlatforms.MAC;
    }
    else if (platform == 'win32') {
        platformDescription = SupportedPlatforms.WINDOWS;
    }
    else if (platform == 'linux') {
        platformDescription = SupportedPlatforms.LINUX;
    }
    else {
        platformDescription = SupportedPlatforms.OTHER;
    }
    if (process.env.CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_DELETION) {
        deploymentTypeDescription = DeploymentTypes.AMPLIFY_ADMIN;
    }
    else {
        deploymentTypeDescription = DeploymentTypes.AMPLIFY_CLI;
    }
    const cliVersion = context.pluginPlatform.plugins.core[0].packageVersion;
    const stackTypeDescription = service ? `${category}-${service}` : category;
    const descriptionJson = {
        createdOn: platformDescription,
        createdBy: deploymentTypeDescription,
        createdWith: cliVersion,
        stackType: stackTypeDescription,
        metadata: {},
    };
    return JSON.stringify(descriptionJson);
}
exports.getDefaultTemplateDescription = getDefaultTemplateDescription;
//# sourceMappingURL=template-description-utils.js.map