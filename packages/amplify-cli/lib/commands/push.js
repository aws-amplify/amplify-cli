"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const update_tracked_files_1 = require("../extensions/amplify-helpers/update-tracked-files");
const current_cloud_backend_utils_1 = require("../extensions/amplify-helpers/current-cloud-backend-utils");
const updateTrackedFiles = async () => {
    await (0, update_tracked_files_1.updateCognitoTrackedFiles)();
};
const run = async (context) => {
    var _a;
    context.amplify.constructExeInfo(context);
    if (context.exeInfo.localEnvInfo.noUpdateBackend) {
        throw new amplify_cli_core_1.AmplifyError('NoUpdateBackendError', { message: 'The local environment configuration does not allow backend updates.' });
    }
    if ((_a = context.parameters.options) === null || _a === void 0 ? void 0 : _a.force) {
        context.exeInfo.forcePush = true;
    }
    if (!context.exeInfo.forcePush) {
        await (0, current_cloud_backend_utils_1.syncCurrentCloudBackend)(context);
    }
    await updateTrackedFiles();
    return context.amplify.pushResources(context);
};
exports.run = run;
//# sourceMappingURL=push.js.map