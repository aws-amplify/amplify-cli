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
exports.run = exports.name = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const cloudformation_walkthrough_1 = require("../../walkthroughs/cloudformation-walkthrough");
const constants_1 = require("../../utils/constants");
const path = __importStar(require("path"));
exports.name = 'update';
async function run(context) {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const customResources = constants_1.categoryName in amplifyMeta ? Object.keys(amplifyMeta[constants_1.categoryName]) : [];
    if (customResources.length > 0) {
        const resourceName = await amplify_prompts_1.prompter.pick('Select the custom resource to update', customResources);
        if (amplifyMeta[constants_1.categoryName][resourceName].service === constants_1.CDK_SERVICE_NAME) {
            const resourceDirPath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_1.categoryName, resourceName);
            const cdkFilepath = path.join(resourceDirPath, constants_1.cdkFileName);
            if (await amplify_prompts_1.prompter.yesOrNo('Do you want to edit the CDK stack now?', true)) {
                await context.amplify.openEditor(context, cdkFilepath);
            }
        }
        else if (amplifyMeta[constants_1.categoryName][resourceName].service === constants_1.CFN_SERVICE_NAME) {
            await (0, cloudformation_walkthrough_1.updateCloudFormationWalkthrough)(context, resourceName);
        }
        else {
            amplify_prompts_1.printer.error('Resource update is not currently supported');
        }
    }
    else {
        amplify_prompts_1.printer.error('No custom resources found.');
    }
}
exports.run = run;
//# sourceMappingURL=update.js.map