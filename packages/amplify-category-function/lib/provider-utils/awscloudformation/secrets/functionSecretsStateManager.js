"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalFunctionSecretNames = exports.storeSecretsPendingRemoval = exports.FunctionSecretsStateManager = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_function_plugin_interface_1 = require("@aws-amplify/amplify-function-plugin-interface");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const constants_1 = require("../../../constants");
const secretValuesWalkthrough_1 = require("../service-walkthroughs/secretValuesWalkthrough");
const cloudformationHelpers_1 = require("../utils/cloudformationHelpers");
const constants_2 = require("../utils/constants");
const funcionStateUtils_1 = require("../utils/funcionStateUtils");
const storeResources_1 = require("../utils/storeResources");
const updateTopLevelComment_1 = require("../utils/updateTopLevelComment");
const secretDeltaUtilities_1 = require("./secretDeltaUtilities");
const secretName_1 = require("./secretName");
const secretsCfnModifier_1 = require("./secretsCfnModifier");
const ssmClientWrapper_1 = require("./ssmClientWrapper");
let secretsPendingRemoval = {};
class FunctionSecretsStateManager {
    constructor(context, ssmClientWrapper) {
        this.context = context;
        this.ssmClientWrapper = ssmClientWrapper;
        this.syncSecretDeltas = async (secretDeltas, functionName, envName) => {
            if (!secretDeltas) {
                return;
            }
            await Promise.all(Object.entries(secretDeltas).map(async ([secretName, secretDelta]) => {
                const fullyQualifiedSecretName = (0, secretName_1.getFullyQualifiedSecretName)(secretName, functionName, envName);
                switch (secretDelta.operation) {
                    case 'remove':
                        if (this.doRemoveSecretsInCloud(functionName)) {
                            await this.ssmClientWrapper.deleteSecret(fullyQualifiedSecretName);
                        }
                        break;
                    case 'set':
                        await this.ssmClientWrapper.setSecret(fullyQualifiedSecretName, secretDelta.value);
                        break;
                    default:
                }
            }));
            try {
                const origTemplate = await (0, cloudformationHelpers_1.getFunctionCloudFormationTemplate)(functionName);
                const newTemplate = await (0, secretsCfnModifier_1.updateSecretsInCfnTemplate)(origTemplate, secretDeltas, functionName);
                await (0, cloudformationHelpers_1.setFunctionCloudFormationTemplate)(functionName, newTemplate);
            }
            catch (err) {
                if ((0, secretDeltaUtilities_1.hasExistingSecrets)(secretDeltas)) {
                    throw err;
                }
            }
            await (0, updateTopLevelComment_1.tryPrependSecretsUsageExample)(functionName, Object.keys((0, secretDeltaUtilities_1.getExistingSecrets)(secretDeltas)));
            await (0, amplify_environment_parameters_1.ensureEnvParamManager)();
            setLocalFunctionSecretState(functionName, secretDeltas);
        };
        this.ensureNewLocalSecretsSyncedToCloud = async (functionName) => {
            const localSecretNames = (0, exports.getLocalFunctionSecretNames)(functionName);
            if (!localSecretNames.length) {
                return;
            }
            const cloudSecretNames = await this.getCloudFunctionSecretNames(functionName);
            const addedSecrets = localSecretNames.filter((name) => !cloudSecretNames.includes(name));
            if (!addedSecrets.length) {
                return;
            }
            if (!this.isInteractive()) {
                const resolution = `Run 'amplify push' interactively to specify values.\n` +
                    `Alternatively, manually add values in SSM ParameterStore for the following parameter names:\n\n` +
                    `${addedSecrets.map((secretName) => (0, secretName_1.getFullyQualifiedSecretName)(secretName, functionName)).join('\n')}\n`;
                throw new amplify_cli_core_1.AmplifyError('EnvironmentConfigurationError', {
                    message: `Function ${functionName} is missing secret values in this environment.`,
                    details: `[${addedSecrets}] ${addedSecrets.length > 1 ? 'does' : 'do'} not have values.`,
                    resolution,
                    link: 'https://docs.amplify.aws/cli/reference/ssm-parameter-store/#manually-creating-parameters',
                });
            }
            const delta = await (0, secretValuesWalkthrough_1.prePushMissingSecretsWalkthrough)(functionName, addedSecrets);
            await this.syncSecretDeltas(delta, functionName);
        };
        this.deleteAllFunctionSecrets = async (functionName) => {
            const cloudSecretNames = await this.getCloudFunctionSecretNames(functionName);
            await this.syncSecretDeltas((0, secretDeltaUtilities_1.secretNamesToSecretDeltas)(cloudSecretNames, amplify_function_plugin_interface_1.removeSecret), functionName);
        };
        this.syncSecretsPendingRemoval = async () => {
            await Promise.all(Object.entries(secretsPendingRemoval).map(([functionName, secretNames]) => this.syncSecretDeltas({
                ...(0, secretDeltaUtilities_1.secretNamesToSecretDeltas)((0, exports.getLocalFunctionSecretNames)(functionName)),
                ...(0, secretDeltaUtilities_1.secretNamesToSecretDeltas)(secretNames, amplify_function_plugin_interface_1.removeSecret),
            }, functionName)));
            secretsPendingRemoval = {};
        };
        this.deleteAllEnvironmentSecrets = async (envName) => {
            const secretNames = await this.ssmClientWrapper.getSecretNamesByPath((0, secretName_1.getEnvSecretPrefix)(envName));
            await this.ssmClientWrapper.deleteSecrets(secretNames);
        };
        this.getEnvCloneDeltas = async (sourceEnv, functionName) => {
            const destDelta = (0, secretDeltaUtilities_1.secretNamesToSecretDeltas)((0, exports.getLocalFunctionSecretNames)(functionName), amplify_function_plugin_interface_1.retainSecret);
            const sourceCloudSecretNames = await this.getCloudFunctionSecretNames(functionName, sourceEnv);
            const sourceCloudSecrets = await this.ssmClientWrapper.getSecrets(sourceCloudSecretNames.map((name) => (0, secretName_1.getFullyQualifiedSecretName)(name, functionName, sourceEnv)));
            sourceCloudSecrets.reduce((acc, { secretName, secretValue }) => {
                const shortName = secretName.slice((0, secretName_1.getFunctionSecretPrefix)(functionName, sourceEnv).length);
                acc[shortName] = (0, amplify_function_plugin_interface_1.setSecret)(secretValue);
                return acc;
            }, destDelta);
            return destDelta;
        };
        this.getCloudFunctionSecretNames = async (functionName, envName) => {
            const prefix = (0, secretName_1.getFunctionSecretPrefix)(functionName, envName);
            const parts = path.parse(prefix);
            const unfilteredSecrets = await this.ssmClientWrapper.getSecretNamesByPath(parts.dir);
            return unfilteredSecrets.filter((secretName) => secretName.startsWith(prefix)).map((secretName) => secretName.slice(prefix.length));
        };
        this.doRemoveSecretsInCloud = (functionName) => {
            const isCommandPush = this.context.parameters.command === 'push';
            return !(0, funcionStateUtils_1.isFunctionPushed)(functionName) || isCommandPush;
        };
        this.isInteractive = () => { var _b, _c, _d; return !((_d = (_c = (_b = this.context) === null || _b === void 0 ? void 0 : _b.input) === null || _c === void 0 ? void 0 : _c.options) === null || _d === void 0 ? void 0 : _d.yes); };
    }
}
exports.FunctionSecretsStateManager = FunctionSecretsStateManager;
_a = FunctionSecretsStateManager;
FunctionSecretsStateManager.getInstance = async (context) => {
    if (!FunctionSecretsStateManager.instance) {
        FunctionSecretsStateManager.instance = new FunctionSecretsStateManager(context, await ssmClientWrapper_1.SSMClientWrapper.getInstance(context));
    }
    return FunctionSecretsStateManager.instance;
};
const storeSecretsPendingRemoval = async (context, functionNames) => {
    functionNames.forEach((functionName) => {
        const cloudSecretNames = (0, exports.getLocalFunctionSecretNames)(functionName, { fromCurrentCloudBackend: true });
        const localSecretNames = (0, exports.getLocalFunctionSecretNames)(functionName);
        const removed = cloudSecretNames.filter((name) => !localSecretNames.includes(name));
        if (removed.length) {
            secretsPendingRemoval[functionName] = removed;
        }
    });
    await storeToBeRemovedFunctionsWithSecrets(context);
};
exports.storeSecretsPendingRemoval = storeSecretsPendingRemoval;
const defaultGetFunctionSecretNamesOptions = {
    fromCurrentCloudBackend: false,
};
const getLocalFunctionSecretNames = (functionName, options = defaultGetFunctionSecretNamesOptions) => {
    options = { ...defaultGetFunctionSecretNamesOptions, ...options };
    const parametersFilePath = path.join(options.fromCurrentCloudBackend ? amplify_cli_core_1.pathManager.getCurrentCloudBackendDirPath() : amplify_cli_core_1.pathManager.getBackendDirPath(), constants_1.categoryName, functionName, constants_2.functionParametersFileName);
    const funcParameters = amplify_cli_core_1.JSONUtilities.readJson(parametersFilePath, { throwIfNotExist: false });
    return (funcParameters === null || funcParameters === void 0 ? void 0 : funcParameters.secretNames) || [];
};
exports.getLocalFunctionSecretNames = getLocalFunctionSecretNames;
const setLocalFunctionSecretState = (functionName, secretDeltas) => {
    const existingSecrets = Object.keys((0, secretDeltaUtilities_1.getExistingSecrets)(secretDeltas));
    const secretsParametersContent = {
        secretNames: existingSecrets,
    };
    const parametersFilePath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_1.categoryName, functionName, constants_2.functionParametersFileName);
    if (fs.existsSync(parametersFilePath)) {
        (0, storeResources_1.createParametersFile)(secretsParametersContent, functionName, constants_2.functionParametersFileName);
    }
    if ((0, secretDeltaUtilities_1.hasExistingSecrets)(secretDeltas)) {
        setAppIdForFunctionInTeamProvider(functionName);
    }
    else {
        removeAppIdForFunctionInTeamProvider(functionName);
    }
};
const setAppIdForFunctionInTeamProvider = (functionName) => {
    (0, amplify_environment_parameters_1.getEnvParamManager)().getResourceParamManager(constants_1.categoryName, functionName).setParam(secretName_1.secretsPathAmplifyAppIdKey, (0, secretName_1.getAppId)());
};
const removeAppIdForFunctionInTeamProvider = (functionName) => {
    (0, amplify_environment_parameters_1.getEnvParamManager)().getResourceParamManager(constants_1.categoryName, functionName).deleteParam(secretName_1.secretsPathAmplifyAppIdKey);
};
const storeToBeRemovedFunctionsWithSecrets = async (context) => {
    const resourceStatus = await context.amplify.getResourceStatus(constants_1.categoryName);
    const resourcesToBeDeleted = ((resourceStatus === null || resourceStatus === void 0 ? void 0 : resourceStatus.resourcesToBeDeleted) || []);
    const deletedLambdas = resourcesToBeDeleted
        .filter((resource) => resource.service === "Lambda")
        .map((resource) => resource.resourceName);
    for (const deletedLambda of deletedLambdas) {
        const cloudSecretNames = (0, exports.getLocalFunctionSecretNames)(deletedLambda, { fromCurrentCloudBackend: true });
        const localSecretNames = (0, exports.getLocalFunctionSecretNames)(deletedLambda);
        const secretNames = Array.from(new Set(cloudSecretNames.concat(localSecretNames)));
        if (secretNames.length) {
            secretsPendingRemoval[deletedLambda] = secretNames;
        }
    }
};
//# sourceMappingURL=functionSecretsStateManager.js.map