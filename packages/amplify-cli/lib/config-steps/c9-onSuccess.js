"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onSuccess = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
async function onSuccess(context) {
    const { projectPath } = context.exeInfo;
    amplify_cli_core_1.stateManager.setProjectConfig(projectPath, context.exeInfo.projectConfig);
    amplify_cli_core_1.stateManager.setLocalEnvInfo(undefined, context.exeInfo.localEnvInfo);
    await context.amplify.onCategoryOutputsChange(context);
    printWelcomeMessage(context);
}
exports.onSuccess = onSuccess;
function printWelcomeMessage(context) {
    context.print.info('');
    context.print.success('Successfully made configuration changes to your project.');
    context.print.info('');
}
//# sourceMappingURL=c9-onSuccess.js.map