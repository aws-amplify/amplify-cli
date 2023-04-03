"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayBannerMessages = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const ci_info_1 = require("ci-info");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const displayBannerMessages = async (input) => {
    const excludedCommands = ['delete', 'env', 'help', 'logout', 'version'];
    if (ci_info_1.isCI || (input.command && excludedCommands.includes(input.command))) {
        return;
    }
    await displayLayerMigrationMessage();
    await displayXrDeprecationMessage();
    if ((0, amplify_cli_core_1.skipHooks)()) {
        amplify_prompts_1.printer.warn('Amplify command hooks are disabled in the current execution environment.');
        amplify_prompts_1.printer.warn('See https://docs.amplify.aws/cli/usage/command-hooks/ for more information.');
    }
};
exports.displayBannerMessages = displayBannerMessages;
const displayLayerMigrationMessage = async () => {
    const layerMigrationBannerMessage = await amplify_cli_core_1.BannerMessage.getMessage('LAMBDA_LAYER_MIGRATION_WARNING');
    const rootPath = amplify_cli_core_1.pathManager.findProjectRoot();
    if (rootPath === undefined) {
        return;
    }
    const meta = amplify_cli_core_1.stateManager.getMeta(rootPath, { throwIfNotExist: false });
    const hasDeprecatedLayerResources = Object.values((meta === null || meta === void 0 ? void 0 : meta.function) || {}).filter((resource) => (resource === null || resource === void 0 ? void 0 : resource.service) === 'LambdaLayer' && (resource === null || resource === void 0 ? void 0 : resource.layerVersionMap) !== undefined).length > 0;
    if (hasDeprecatedLayerResources && layerMigrationBannerMessage) {
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.warn(layerMigrationBannerMessage);
        amplify_prompts_1.printer.blankLine();
    }
};
const displayXrDeprecationMessage = async () => {
    const rootPath = amplify_cli_core_1.pathManager.findProjectRoot();
    if (rootPath === undefined) {
        return;
    }
    const meta = amplify_cli_core_1.stateManager.getMeta(rootPath, { throwIfNotExist: false });
    if (meta) {
        const hasXr = 'xr' in meta;
        if (hasXr) {
            amplify_prompts_1.printer.blankLine();
            amplify_prompts_1.printer.warn('The Amazon Sumerian service is no longer accepting new customers.' +
                ' Existing customer scenes will not be available after February 21, 2023.' +
                ' The AWS Amplify XR features depend on the Amazon Sumerian service to function and as a result, will no longer be available.');
            amplify_prompts_1.printer.blankLine();
        }
    }
};
//# sourceMappingURL=display-banner-messages.js.map