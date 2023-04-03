"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDeploymentSecrets = exports.removeResourceParameters = exports.loadEnvResourceParameters = exports.saveEnvResourceParameters = void 0;
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const amplify_cli_core_1 = require("amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
const get_root_stack_id_1 = require("./get-root-stack-id");
const hostedUIProviderCredsField = 'hostedUIProviderCreds';
const saveEnvResourceParameters = (__, category, resource, parameters) => {
    if (!parameters) {
        return;
    }
    const { hostedUIProviderCreds, ...nonSecretParams } = parameters;
    (0, amplify_environment_parameters_1.getEnvParamManager)().getResourceParamManager(category, resource).setParams(nonSecretParams);
    const deploymentSecrets = amplify_cli_core_1.stateManager.getDeploymentSecrets();
    const rootStackId = (0, get_root_stack_id_1.getRootStackId)();
    const currentEnv = amplify_cli_core_1.stateManager.getLocalEnvInfo().envName;
    if (hostedUIProviderCreds) {
        amplify_cli_core_1.stateManager.setDeploymentSecrets((0, amplify_cli_core_1.mergeDeploymentSecrets)({
            currentDeploymentSecrets: deploymentSecrets,
            rootStackId,
            category,
            envName: currentEnv,
            keyName: hostedUIProviderCredsField,
            value: hostedUIProviderCreds,
            resource,
        }));
    }
    else {
        amplify_cli_core_1.stateManager.setDeploymentSecrets((0, amplify_cli_core_1.removeFromDeploymentSecrets)({
            currentDeploymentSecrets: deploymentSecrets,
            rootStackId,
            category,
            resource,
            envName: currentEnv,
            keyName: hostedUIProviderCredsField,
        }));
    }
};
exports.saveEnvResourceParameters = saveEnvResourceParameters;
const loadEnvResourceParameters = (__, category, resource) => {
    const envParameters = {
        ...loadEnvResourceParametersFromDeploymentSecrets(category, resource),
        ...(0, amplify_environment_parameters_1.getEnvParamManager)().getResourceParamManager(category, resource).getAllParams(),
    };
    return envParameters;
};
exports.loadEnvResourceParameters = loadEnvResourceParameters;
const loadEnvResourceParametersFromDeploymentSecrets = (category, resource) => {
    try {
        const currentEnv = amplify_cli_core_1.stateManager.getLocalEnvInfo().envName;
        const deploymentSecrets = amplify_cli_core_1.stateManager.getDeploymentSecrets();
        const rootStackId = (0, get_root_stack_id_1.getRootStackId)();
        const deploymentSecretByAppId = lodash_1.default.find(deploymentSecrets.appSecrets, (appSecret) => appSecret.rootStackId === rootStackId);
        if (deploymentSecretByAppId) {
            return lodash_1.default.get(deploymentSecretByAppId.environments, [currentEnv, category, resource]);
        }
        const parameters = amplify_cli_core_1.stateManager.getResourceParametersJson(undefined, category, resource);
        if (parameters && parameters.hostedUI) {
            return lodash_1.default.setWith({}, hostedUIProviderCredsField, '[]');
        }
    }
    catch (e) {
    }
    return {};
};
const removeResourceParameters = (context, category, resource) => {
    (0, amplify_environment_parameters_1.getEnvParamManager)().removeResourceParamManager(category, resource);
    (0, exports.removeDeploymentSecrets)(context, category, resource);
};
exports.removeResourceParameters = removeResourceParameters;
const removeDeploymentSecrets = (__, category, resource) => {
    const currentEnv = amplify_cli_core_1.stateManager.getLocalEnvInfo().envName;
    const deploymentSecrets = amplify_cli_core_1.stateManager.getDeploymentSecrets();
    const rootStackId = (0, get_root_stack_id_1.getRootStackId)();
    amplify_cli_core_1.stateManager.setDeploymentSecrets((0, amplify_cli_core_1.removeFromDeploymentSecrets)({
        currentDeploymentSecrets: deploymentSecrets,
        rootStackId,
        envName: currentEnv,
        category,
        resource,
        keyName: hostedUIProviderCredsField,
    }));
};
exports.removeDeploymentSecrets = removeDeploymentSecrets;
//# sourceMappingURL=envResourceParams.js.map