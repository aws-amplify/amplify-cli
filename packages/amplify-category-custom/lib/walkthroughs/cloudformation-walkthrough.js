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
exports.updateCloudFormationWalkthrough = exports.addCloudFormationWalkthrough = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const common_questions_1 = require("../utils/common-questions");
const constants_1 = require("../utils/constants");
const dependency_management_utils_1 = require("../utils/dependency-management-utils");
const cfnTemplateRoot = path.normalize(path.join(__dirname, '../../resources'));
const cfnFilename = 'cloudformation-template-skeleton.ejs';
async function addCloudFormationWalkthrough(context) {
    const resourceName = await (0, common_questions_1.customResourceNameQuestion)();
    await generateSkeletonDir(context, resourceName);
    await updateAmplifyMetaFiles(context, resourceName);
    await (0, dependency_management_utils_1.addCFNResourceDependency)(context, resourceName);
    amplify_prompts_1.printer.success(`Created skeleton CloudFormation stack in amplify/backend/custom/${resourceName} directory`);
    const resourceDirPath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_1.categoryName, resourceName);
    const customResourceCFNFilename = `${resourceName}-${constants_1.customResourceCFNFilenameSuffix}`;
    const cfnFilepath = path.join(resourceDirPath, customResourceCFNFilename);
    if (await amplify_prompts_1.prompter.yesOrNo('Do you want to edit the CloudFormation stack now?', true)) {
        await context.amplify.openEditor(context, cfnFilepath);
    }
}
exports.addCloudFormationWalkthrough = addCloudFormationWalkthrough;
async function updateCloudFormationWalkthrough(context, resourceName) {
    await (0, dependency_management_utils_1.addCFNResourceDependency)(context, resourceName);
    const resourceDirPath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_1.categoryName, resourceName);
    const customResourceCFNFilename = `${resourceName}-${constants_1.customResourceCFNFilenameSuffix}`;
    const cfnFilepath = path.join(resourceDirPath, customResourceCFNFilename);
    if (await amplify_prompts_1.prompter.yesOrNo('Do you want to edit the CloudFormation stack now?', true)) {
        await context.amplify.openEditor(context, cfnFilepath);
    }
}
exports.updateCloudFormationWalkthrough = updateCloudFormationWalkthrough;
async function generateSkeletonDir(context, resourceName) {
    const targetDir = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_1.categoryName, resourceName);
    const customResourceCFNFilename = `${resourceName}-${constants_1.customResourceCFNFilenameSuffix}`;
    if (fs.existsSync(targetDir)) {
        throw new Error(`Custom resource with ${resourceName} already exists.`);
    }
    const copyJobs = [
        {
            dir: cfnTemplateRoot,
            template: cfnFilename,
            target: path.join(targetDir, customResourceCFNFilename),
        },
    ];
    const params = {
        resourceName,
    };
    await context.amplify.copyBatch(context, copyJobs, params);
}
async function updateAmplifyMetaFiles(context, resourceName) {
    const backendConfigs = {
        service: constants_1.CFN_SERVICE_NAME,
        providerPlugin: constants_1.DEPLOYMENT_PROVIDER_NAME,
    };
    context.amplify.updateamplifyMetaAfterResourceAdd(constants_1.categoryName, resourceName, backendConfigs);
}
//# sourceMappingURL=cloudformation-walkthrough.js.map