"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromDeploymentSecrets = exports.mergeDeploymentSecrets = void 0;
const lodash_1 = __importDefault(require("lodash"));
const recursiveOmit_1 = require("./utils/recursiveOmit");
const mergeDeploymentSecrets = (deploymentSecretsModifier) => {
    var _a;
    const { currentDeploymentSecrets, category, rootStackId, envName, resource, keyName, value } = deploymentSecretsModifier;
    const newDeploymentAppSecret = lodash_1.default.find(currentDeploymentSecrets.appSecrets, (appSecret) => appSecret.rootStackId === rootStackId) || {
        rootStackId,
        environments: {},
    };
    lodash_1.default.setWith(newDeploymentAppSecret, ['environments', envName, category, resource, keyName], value);
    const filteredSecrets = ((_a = currentDeploymentSecrets.appSecrets) === null || _a === void 0 ? void 0 : _a.filter((appSecret) => appSecret.rootStackId !== rootStackId)) || [];
    return {
        appSecrets: [...filteredSecrets, newDeploymentAppSecret],
    };
};
exports.mergeDeploymentSecrets = mergeDeploymentSecrets;
const removeFromDeploymentSecrets = (deploymentSecretsModifier) => {
    var _a;
    const { currentDeploymentSecrets, category, rootStackId, envName, resource, keyName } = deploymentSecretsModifier;
    const secretsByAppId = lodash_1.default.find(currentDeploymentSecrets.appSecrets, (secrets) => secrets.rootStackId === rootStackId);
    if (secretsByAppId) {
        (0, recursiveOmit_1.recursiveOmit)(secretsByAppId.environments, [envName, category, resource, keyName]);
        if (Object.keys(secretsByAppId.environments).length === 0) {
            currentDeploymentSecrets.appSecrets =
                ((_a = currentDeploymentSecrets.appSecrets) === null || _a === void 0 ? void 0 : _a.filter((appSecret) => appSecret.rootStackId !== rootStackId)) || [];
        }
    }
    return currentDeploymentSecrets;
};
exports.removeFromDeploymentSecrets = removeFromDeploymentSecrets;
//# sourceMappingURL=deploymentSecretsHelper.js.map