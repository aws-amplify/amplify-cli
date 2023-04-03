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
exports.addCDKWalkthrough = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const build_custom_resources_1 = require("../utils/build-custom-resources");
const common_questions_1 = require("../utils/common-questions");
const constants_1 = require("../utils/constants");
async function addCDKWalkthrough(context) {
    const resourceName = await (0, common_questions_1.customResourceNameQuestion)();
    await generateSkeletonDir(resourceName);
    await updateAmplifyMetaFiles(context, resourceName);
    amplify_prompts_1.printer.success(`Created skeleton CDK stack in amplify/backend/custom/${resourceName} directory`);
    await (0, build_custom_resources_1.buildCustomResources)(context, resourceName);
    const resourceDirPath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_1.categoryName, resourceName);
    const cdkFilepath = path.join(resourceDirPath, constants_1.cdkFileName);
    if (await amplify_prompts_1.prompter.yesOrNo('Do you want to edit the CDK stack now?', true)) {
        await context.amplify.openEditor(context, cdkFilepath);
    }
}
exports.addCDKWalkthrough = addCDKWalkthrough;
async function updateAmplifyMetaFiles(context, resourceName) {
    const backendConfigs = {
        service: constants_1.CDK_SERVICE_NAME,
        providerPlugin: constants_1.DEPLOYMENT_PROVIDER_NAME,
    };
    context.amplify.updateamplifyMetaAfterResourceAdd(constants_1.categoryName, resourceName, backendConfigs);
}
async function generateSkeletonDir(resourceName) {
    const targetDir = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_1.categoryName, resourceName);
    if (fs.existsSync(targetDir)) {
        throw new Error(`Custom resource with ${resourceName} already exists.`);
    }
    fs.ensureDirSync(targetDir);
    const packageJSONFilePath = path.join(targetDir, 'package.json');
    const srcResourceDirPath = path.normalize(path.join(__dirname, '../../resources'));
    if (!fs.existsSync(packageJSONFilePath)) {
        amplify_cli_core_1.JSONUtilities.writeJson(packageJSONFilePath, amplify_cli_core_1.JSONUtilities.readJson(path.join(srcResourceDirPath, 'package.json')));
    }
    const tsConfigFilePath = path.join(targetDir, 'tsconfig.json');
    if (!fs.existsSync(tsConfigFilePath)) {
        amplify_cli_core_1.JSONUtilities.writeJson(tsConfigFilePath, amplify_cli_core_1.JSONUtilities.readJson(path.join(srcResourceDirPath, 'tsconfig.json')));
    }
    const cdkFilepath = path.join(targetDir, 'cdk-stack.ts');
    fs.writeFileSync(cdkFilepath, fs.readFileSync(path.join(srcResourceDirPath, 'cdk-stack.ts.sample')));
}
//# sourceMappingURL=cdk-walkthrough.js.map