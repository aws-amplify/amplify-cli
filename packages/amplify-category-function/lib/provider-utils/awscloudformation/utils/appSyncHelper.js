"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppSyncResourceName = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
function getAppSyncResourceName() {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const resource = 'api' in amplifyMeta ? Object.keys(amplifyMeta.api).find((key) => amplifyMeta.api[key].service === 'AppSync') : undefined;
    return resource;
}
exports.getAppSyncResourceName = getAppSyncResourceName;
//# sourceMappingURL=appSyncHelper.js.map