"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPermissionsBoundaryArn = exports.getPermissionsBoundaryArn = void 0;
const lodash_1 = __importDefault(require("lodash"));
const state_manager_1 = require("./state-manager");
let preInitTeamProviderInfo;
const getPermissionsBoundaryArn = (env) => {
    try {
        const tpi = preInitTeamProviderInfo !== null && preInitTeamProviderInfo !== void 0 ? preInitTeamProviderInfo : state_manager_1.stateManager.getTeamProviderInfo();
        if (preInitTeamProviderInfo && Object.keys(preInitTeamProviderInfo).length === 1 && !env) {
            env = Object.keys(preInitTeamProviderInfo)[0];
        }
        return lodash_1.default.get(tpi, teamProviderInfoObjectPath(env));
    }
    catch (_a) {
        return undefined;
    }
};
exports.getPermissionsBoundaryArn = getPermissionsBoundaryArn;
const setPermissionsBoundaryArn = (arn, env, teamProviderInfo) => {
    let tpiGetter = () => state_manager_1.stateManager.getTeamProviderInfo();
    let tpiSetter = (tpi) => {
        state_manager_1.stateManager.setTeamProviderInfo(undefined, tpi);
        preInitTeamProviderInfo = undefined;
    };
    if (teamProviderInfo) {
        tpiGetter = () => teamProviderInfo;
        tpiSetter = (tpi) => {
            preInitTeamProviderInfo = tpi;
        };
    }
    const tpi = tpiGetter();
    if (!arn) {
        lodash_1.default.unset(tpi, teamProviderInfoObjectPath(env));
    }
    else {
        lodash_1.default.setWith(tpi, teamProviderInfoObjectPath(env), arn);
    }
    tpiSetter(tpi);
};
exports.setPermissionsBoundaryArn = setPermissionsBoundaryArn;
const teamProviderInfoObjectPath = (env) => [
    env || state_manager_1.stateManager.getLocalEnvInfo().envName,
    'awscloudformation',
    'PermissionsBoundaryPolicyArn',
];
//# sourceMappingURL=permissionsBoundaryState.js.map