"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRootStackId = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const getRootStackId = () => {
    var _a, _b;
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const stackId = (_b = (_a = amplifyMeta === null || amplifyMeta === void 0 ? void 0 : amplifyMeta.providers) === null || _a === void 0 ? void 0 : _a.awscloudformation) === null || _b === void 0 ? void 0 : _b.StackId;
    if (typeof stackId === 'string') {
        return stackId.split('/')[2];
    }
    throw new Error('Root stack Id not found');
};
exports.getRootStackId = getRootStackId;
//# sourceMappingURL=get-root-stack-id.js.map