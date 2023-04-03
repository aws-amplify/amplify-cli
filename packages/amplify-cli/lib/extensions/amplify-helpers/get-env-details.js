"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvDetails = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const getEnvDetails = () => {
    const teamProviderInfo = amplify_cli_core_1.stateManager.getTeamProviderInfo(undefined, {
        throwIfNotExist: false,
        default: {},
    });
    return teamProviderInfo;
};
exports.getEnvDetails = getEnvDetails;
//# sourceMappingURL=get-env-details.js.map