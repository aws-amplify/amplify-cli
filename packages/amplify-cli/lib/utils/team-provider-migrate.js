"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateTeamProviderInfo = void 0;
const amplify_category_auth_1 = require("@aws-amplify/amplify-category-auth");
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const amplify_cli_core_1 = require("amplify-cli-core");
const chalk_1 = __importDefault(require("chalk"));
const get_root_stack_id_1 = require("../extensions/amplify-helpers/get-root-stack-id");
const headless_input_utils_1 = require("./headless-input-utils");
const message = `Amplify has been upgraded to handle secrets more securely by migrating some values in ${chalk_1.default.red(amplify_cli_core_1.PathConstants.TeamProviderInfoFileName)} to ${chalk_1.default.green(amplify_cli_core_1.PathConstants.DeploymentSecretsFileName)}
You can create a backup of the ${chalk_1.default.red(amplify_cli_core_1.PathConstants.TeamProviderInfoFileName)} file before proceeding.`;
const hostedUIProviderCredsField = 'hostedUIProviderCreds';
const migrateTeamProviderInfo = async (context) => {
    if (!amplify_cli_core_1.stateManager.teamProviderInfoExists()) {
        return true;
    }
    if (!isInvalidEnvOrPulling(context) && amplify_cli_core_1.pathManager.findProjectRoot()) {
        await (0, amplify_environment_parameters_1.ensureEnvParamManager)();
        const authResourceName = authResourceNameHasSecrets();
        if (!authResourceName) {
            return true;
        }
        if ((0, headless_input_utils_1.isYesFlagSet)(context) || (await context.prompt.confirm(message))) {
            const authParams = amplify_cli_core_1.stateManager.getResourceParametersJson(undefined, 'auth', authResourceName);
            moveAuthSecretToDeploymentSecrets(authResourceName);
            await (0, amplify_category_auth_1.externalAuthEnable)(context, undefined, undefined, authParams);
        }
        else {
            return false;
        }
    }
    return true;
};
exports.migrateTeamProviderInfo = migrateTeamProviderInfo;
const isInvalidEnvOrPulling = (context) => {
    if (!amplify_cli_core_1.stateManager.localEnvInfoExists()) {
        return true;
    }
    if (context.input.command) {
        return ['pull', 'init', 'env', 'delete'].includes(context.input.command);
    }
    return false;
};
const authResourceNameHasSecrets = () => {
    const backendConfig = amplify_cli_core_1.stateManager.getBackendConfig(undefined, { throwIfNotExist: false });
    const authResourceName = Object.keys((backendConfig === null || backendConfig === void 0 ? void 0 : backendConfig.auth) || {})[0];
    if (!authResourceName) {
        return undefined;
    }
    if ((0, amplify_environment_parameters_1.getEnvParamManager)().getResourceParamManager('auth', authResourceName).hasParam(hostedUIProviderCredsField)) {
        return authResourceName;
    }
    return undefined;
};
const moveAuthSecretToDeploymentSecrets = (authResourceName) => {
    const resourceParamManager = (0, amplify_environment_parameters_1.getEnvParamManager)().getResourceParamManager('auth', authResourceName);
    const teamProviderSecrets = resourceParamManager.getParam(hostedUIProviderCredsField);
    const rootStackId = (0, get_root_stack_id_1.getRootStackId)();
    const { envName } = amplify_cli_core_1.stateManager.getLocalEnvInfo();
    let secrets = amplify_cli_core_1.stateManager.getDeploymentSecrets();
    secrets = (0, amplify_cli_core_1.mergeDeploymentSecrets)({
        currentDeploymentSecrets: secrets,
        category: 'auth',
        rootStackId,
        envName,
        resource: authResourceName,
        keyName: hostedUIProviderCredsField,
        value: teamProviderSecrets,
    });
    amplify_cli_core_1.stateManager.setDeploymentSecrets(secrets);
    resourceParamManager.deleteParam(hostedUIProviderCredsField);
};
//# sourceMappingURL=team-provider-migrate.js.map