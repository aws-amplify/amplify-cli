"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showBuildDirChangesMessage = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const update_tracked_files_1 = require("./update-tracked-files");
const showBuildDirChangesMessage = async () => {
    if (await (0, update_tracked_files_1.detectCognitoAttributesRequireVerificationBeforeUpdateDiff)()) {
        amplify_prompts_1.printer.warn(`Amplify CLI now supports verifying a Cognito user email address that has been changed and will automatically update your auth \
configuration. Read more: https://docs.amplify.aws/lib/auth/manageusers/q/platform/js/#updating-and-verifying-a-cognito-user-email-address`);
    }
};
exports.showBuildDirChangesMessage = showBuildDirChangesMessage;
//# sourceMappingURL=auto-updates.js.map