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
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const path = __importStar(require("path"));
const ddb_stack_transform_1 = require("../../provider-utils/awscloudformation/cdk-stack-builder/ddb-stack-transform");
const s3_stack_transform_1 = require("../../provider-utils/awscloudformation/cdk-stack-builder/s3-stack-transform");
const dynamoDB_input_state_1 = require("../../provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state");
const s3_user_input_state_1 = require("../../provider-utils/awscloudformation/service-walkthroughs/s3-user-input-state");
exports.name = 'override';
const run = async (context) => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const storageResources = [];
    if (amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE]) {
        Object.keys(amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE]).forEach((resourceName) => {
            storageResources.push(resourceName);
        });
    }
    if (storageResources.length === 0) {
        const errMessage = 'No resources to override. You need to add a resource.';
        amplify_prompts_1.printer.error(errMessage);
        return;
    }
    let selectedResourceName = storageResources[0];
    if (storageResources.length > 1) {
        selectedResourceName = await amplify_prompts_1.prompter.pick('Which resource would you like to override?', storageResources);
    }
    const destPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, amplify_cli_core_1.AmplifyCategories.STORAGE, selectedResourceName);
    const srcPath = path.join(__dirname, '..', '..', '..', 'resources', 'overrides-resource', amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE][selectedResourceName].service);
    if (amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE][selectedResourceName].service === amplify_cli_core_1.AmplifySupportedService.DYNAMODB) {
        const resourceInputState = new dynamoDB_input_state_1.DynamoDBInputState(context, selectedResourceName);
        if (!resourceInputState.cliInputFileExists()) {
            if (await amplify_prompts_1.prompter.yesOrNo((0, amplify_cli_core_1.getMigrateResourceMessageForOverride)(amplify_cli_core_1.AmplifyCategories.STORAGE, selectedResourceName, false), true)) {
                await resourceInputState.migrate();
                const stackGenerator = new ddb_stack_transform_1.DDBStackTransform(context, selectedResourceName);
                await stackGenerator.transform();
            }
            else {
                return;
            }
        }
    }
    else if (amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE][selectedResourceName].service === amplify_cli_core_1.AmplifySupportedService.S3) {
        const s3ResourceInputState = new s3_user_input_state_1.S3InputState(context, selectedResourceName, undefined);
        if (!s3ResourceInputState.cliInputFileExists()) {
            if (await amplify_prompts_1.prompter.yesOrNo((0, amplify_cli_core_1.getMigrateResourceMessageForOverride)(amplify_cli_core_1.AmplifyCategories.STORAGE, selectedResourceName, false), true)) {
                await s3ResourceInputState.migrate(context);
                const stackGenerator = new s3_stack_transform_1.AmplifyS3ResourceStackTransform(selectedResourceName, context);
                await stackGenerator.transform(amplify_cli_core_1.CLISubCommandType.MIGRATE);
            }
            else {
                return;
            }
        }
    }
    await (0, amplify_cli_core_1.generateOverrideSkeleton)(context, srcPath, destPath);
};
exports.run = run;
//# sourceMappingURL=override.js.map