"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllEnvs = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const getAllEnvs = () => Object.keys(amplify_cli_core_1.stateManager.getLocalAWSInfo(undefined, {
    throwIfNotExist: false,
    default: {},
}));
exports.getAllEnvs = getAllEnvs;
//# sourceMappingURL=get-all-envs.js.map