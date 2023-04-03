"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAppId = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const resolveAppId = (context) => {
    var _a, _b, _c, _d, _e;
    if (amplify_cli_core_1.stateManager.metaFileExists()) {
        const meta = amplify_cli_core_1.stateManager.getMeta();
        if ((_b = (_a = meta === null || meta === void 0 ? void 0 : meta.providers) === null || _a === void 0 ? void 0 : _a.awscloudformation) === null || _b === void 0 ? void 0 : _b.AmplifyAppId) {
            return meta.providers.awscloudformation.AmplifyAppId;
        }
        throw new amplify_cli_core_1.AmplifyError('ProjectAppIdResolveError', {
            message: 'Could not find AmplifyAppId in amplify-meta.json.',
        });
    }
    else if ((_e = (_d = (_c = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _c === void 0 ? void 0 : _c.inputParams) === null || _d === void 0 ? void 0 : _d.amplify) === null || _e === void 0 ? void 0 : _e.appId) {
        return context.exeInfo.inputParams.amplify.appId;
    }
    else {
        throw new amplify_cli_core_1.AmplifyError('ProjectAppIdResolveError', {
            message: 'Failed to resolve appId.',
        });
    }
};
exports.resolveAppId = resolveAppId;
//# sourceMappingURL=resolve-appId.js.map