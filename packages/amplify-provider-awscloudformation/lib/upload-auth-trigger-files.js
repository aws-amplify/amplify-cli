"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAuthTriggerFiles = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const uploadAuthTriggerFiles = async (context, toBeCreated, toBeUpdated) => {
    const newAuth = toBeCreated.find((a) => a.service === amplify_cli_core_1.AmplifySupportedService.COGNITO);
    const updatedAuth = toBeUpdated.find((b) => b.service === amplify_cli_core_1.AmplifySupportedService.COGNITO);
    if (newAuth || updatedAuth) {
        await context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.AUTH, undefined, 'uploadFiles', [context]);
    }
};
exports.uploadAuthTriggerFiles = uploadAuthTriggerFiles;
//# sourceMappingURL=upload-auth-trigger-files.js.map