"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printAuthExistsWarning = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const string_maps_1 = require("../assets/string-maps");
const printAuthExistsWarning = (context) => {
    var _a;
    const meta = amplify_cli_core_1.stateManager.getMeta(undefined, { throwIfNotExist: false });
    const existingAuthResources = Object.entries((meta === null || meta === void 0 ? void 0 : meta.auth) || {});
    if (checkAuthIsImported(existingAuthResources)) {
        const commandVerb = ((_a = context === null || context === void 0 ? void 0 : context.input) === null || _a === void 0 ? void 0 : _a.command) && context.input.command !== 'update' ? context.input.command : 'import';
        amplify_prompts_1.printer.warn('Auth has already been imported to this project and cannot be modified from the CLI. ' +
            `To modify, run "amplify remove auth" to unlink the imported auth resource. Then run "amplify ${commandVerb} auth".`);
    }
    else {
        amplify_prompts_1.printer.warn(string_maps_1.messages.authExists);
    }
};
exports.printAuthExistsWarning = printAuthExistsWarning;
const checkAuthIsImported = (authResources) => {
    return authResources.filter(([_, resource]) => (resource === null || resource === void 0 ? void 0 : resource.serviceType) === 'imported').length > 0;
};
//# sourceMappingURL=print-auth-exists-warning.js.map