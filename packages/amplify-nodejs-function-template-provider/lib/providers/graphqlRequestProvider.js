"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphqlRequest = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const destFileMapper_1 = require("../utils/destFileMapper");
const constants_1 = require("../utils/constants");
const pathToTemplateFilesIAM = path_1.default.join(constants_1.templateRoot, 'lambda', 'appsync-request');
async function graphqlRequest(context) {
    const { allResources } = await context.amplify.getResourceStatus('api');
    const apiResource = allResources.find((resource) => resource.service === amplify_cli_core_1.AmplifySupportedService.APPSYNC);
    if (!apiResource) {
        amplify_prompts_1.printer.error(`${amplify_cli_core_1.AmplifySupportedService.APPSYNC} API does not exist. To add an api, use "amplify add api".`);
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    const AWS_IAM = 'AWS_IAM';
    function isIAM(authType) {
        return authType === AWS_IAM;
    }
    function isAppSyncWithIAM(config) {
        const { authConfig } = config.output;
        return [
            authConfig.defaultAuthentication.authenticationType,
            ...authConfig.additionalAuthenticationProviders.map((provider) => provider.authenticationType),
        ].some(isIAM);
    }
    const iamCheck = isAppSyncWithIAM(apiResource);
    if (!iamCheck) {
        amplify_prompts_1.printer.error(`IAM Auth not enabled for ${amplify_cli_core_1.AmplifySupportedService.APPSYNC} API. To update an api, use "amplify update api".`);
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    const files = fs_extra_1.default.readdirSync(pathToTemplateFilesIAM);
    return {
        functionTemplate: {
            sourceRoot: pathToTemplateFilesIAM,
            sourceFiles: files,
            defaultEditorFile: path_1.default.join('src', 'index.js'),
            destMap: (0, destFileMapper_1.getDstMap)(files),
        },
    };
}
exports.graphqlRequest = graphqlRequest;
//# sourceMappingURL=graphqlRequestProvider.js.map