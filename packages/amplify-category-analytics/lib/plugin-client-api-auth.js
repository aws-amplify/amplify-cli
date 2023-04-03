"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invokeAuthPush = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const invokeAuthPush = async (context) => {
    await context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.AUTH, undefined, 'authPluginAPIPush', [context]);
};
exports.invokeAuthPush = invokeAuthPush;
//# sourceMappingURL=plugin-client-api-auth.js.map