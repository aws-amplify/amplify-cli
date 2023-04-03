"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveAll = exports.getEnvParamManager = exports.ensureEnvParamManager = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
const backend_config_parameters_controller_1 = require("./backend-config-parameters-controller");
const resource_parameter_manager_1 = require("./resource-parameter-manager");
const envParamManagerMap = {};
const ensureEnvParamManager = async (envName = amplify_cli_core_1.stateManager.getLocalEnvInfo().envName) => {
    if (!envParamManagerMap[envName]) {
        const envManager = new EnvironmentParameterManager(envName, (0, backend_config_parameters_controller_1.getParametersControllerInstance)());
        await envManager.init();
        envParamManagerMap[envName] = envManager;
    }
    return {
        instance: envParamManagerMap[envName],
    };
};
exports.ensureEnvParamManager = ensureEnvParamManager;
const getEnvParamManager = (envName = amplify_cli_core_1.stateManager.getLocalEnvInfo().envName) => {
    if (envParamManagerMap[envName]) {
        return envParamManagerMap[envName];
    }
    throw new amplify_cli_core_1.AmplifyFault('ProjectInitFault', {
        message: `EnvironmentParameterManager for ${envName} environment is not initialized.`,
    });
};
exports.getEnvParamManager = getEnvParamManager;
const saveAll = async (serviceUploadHandler) => {
    for (const envParamManager of Object.values(envParamManagerMap)) {
        await envParamManager.save(serviceUploadHandler);
    }
};
exports.saveAll = saveAll;
class EnvironmentParameterManager {
    constructor(envName, parameterMapController) {
        this.envName = envName;
        this.parameterMapController = parameterMapController;
        this.resourceParamManagers = {};
    }
    async init() {
        var _a, _b;
        const categories = ((_b = (_a = amplify_cli_core_1.stateManager.getTeamProviderInfo(undefined, { throwIfNotExist: false })) === null || _a === void 0 ? void 0 : _a[this.envName]) === null || _b === void 0 ? void 0 : _b.categories) || {};
        Object.entries(categories).forEach(([category, resources]) => {
            Object.entries(resources).forEach(([resource, parameters]) => {
                this.getResourceParamManager(category, resource).setAllParams(parameters);
            });
        });
    }
    removeResourceParamManager(category, resource) {
        delete this.resourceParamManagers[getResourceKey(category, resource)];
    }
    getResourceParamManager(category, resource) {
        if (!category || !resource) {
            throw new amplify_cli_core_1.AmplifyFault('ResourceNotFoundFault', {
                message: 'Missing Category or Resource.',
            });
        }
        const resourceKey = getResourceKey(category, resource);
        if (!this.resourceParamManagers[resourceKey]) {
            this.resourceParamManagers[resourceKey] = new resource_parameter_manager_1.ResourceParameterManager();
        }
        return this.resourceParamManagers[resourceKey];
    }
    hasResourceParamManager(category, resource) {
        return !!this.resourceParamManagers[getResourceKey(category, resource)];
    }
    async cloneEnvParamsToNewEnvParamManager(destManager) {
        const resourceKeys = Object.keys(this.resourceParamManagers);
        const categoryResourceNamePairs = resourceKeys.map((key) => key.split('_'));
        categoryResourceNamePairs.forEach(([category, resourceName]) => {
            const srcResourceParamManager = this.getResourceParamManager(category, resourceName);
            const allSrcParams = srcResourceParamManager.getAllParams();
            const destResourceParamManager = destManager.getResourceParamManager(category, resourceName);
            destResourceParamManager.setAllParams(allSrcParams);
        });
        await destManager.save();
    }
    async save(serviceUploadHandler) {
        var _a;
        if (!amplify_cli_core_1.pathManager.findProjectRoot()) {
            return;
        }
        const tpiContent = amplify_cli_core_1.stateManager.getTeamProviderInfo(undefined, { throwIfNotExist: false, default: {} });
        const categoriesContent = this.serializeTPICategories();
        if (Object.keys(categoriesContent).length === 0) {
            (_a = tpiContent === null || tpiContent === void 0 ? void 0 : tpiContent[this.envName]) === null || _a === void 0 ? true : delete _a.categories;
        }
        else {
            if (!tpiContent[this.envName]) {
                tpiContent[this.envName] = {};
            }
            tpiContent[this.envName].categories = this.serializeTPICategories();
        }
        amplify_cli_core_1.stateManager.setTeamProviderInfo(undefined, tpiContent);
        if (this.envName !== amplify_cli_core_1.stateManager.getLocalEnvInfo().envName) {
            return;
        }
        this.parameterMapController.removeAllParameters();
        for (const [resourceKey, paramManager] of Object.entries(this.resourceParamManagers)) {
            const [category, resourceName] = splitResourceKey(resourceKey);
            const resourceParams = paramManager.getAllParams();
            for (const [paramName, paramValue] of Object.entries(resourceParams)) {
                const ssmParamName = getParameterStoreKey(category, resourceName, paramName);
                this.parameterMapController.addParameter(ssmParamName, [{ category, resourceName }]);
                if (serviceUploadHandler) {
                    await serviceUploadHandler(ssmParamName, paramValue);
                }
            }
        }
        await this.parameterMapController.save();
    }
    async downloadParameters(downloadHandler) {
        const missingParameters = (await this.getMissingParameters()).map(({ categoryName, resourceName, parameterName }) => getParameterStoreKey(categoryName, resourceName, parameterName));
        const params = await downloadHandler(missingParameters);
        Object.entries(params).forEach(([key, value]) => {
            const [categoryName, resourceName, parameterName] = getNamesFromParameterStoreKey(key);
            const resourceParamManager = this.getResourceParamManager(categoryName, resourceName);
            resourceParamManager.setParam(parameterName, value);
        });
    }
    async getMissingParameters(resourceFilterList) {
        const expectedParameters = this.parameterMapController.getParameters();
        const allEnvParams = new Set();
        const missingResourceParameters = [];
        for (const [resourceKey, paramManager] of Object.entries(this.resourceParamManagers)) {
            const resourceParams = paramManager.getAllParams();
            for (const paramName of Object.keys(resourceParams)) {
                allEnvParams.add(`${resourceKey}_${paramName}`);
            }
        }
        Object.keys(expectedParameters).forEach((expectedParameter) => {
            const [categoryName, resourceName, parameterName] = getNamesFromParameterStoreKey(expectedParameter);
            if (resourceFilterList &&
                !resourceFilterList.some(({ category, resourceName: resource }) => categoryName === category && resource === resourceName)) {
                return;
            }
            if (!allEnvParams.has(`${categoryName}_${resourceName}_${parameterName}`)) {
                missingResourceParameters.push({ categoryName, resourceName, parameterName });
            }
        });
        return missingResourceParameters;
    }
    async verifyExpectedEnvParameters(resourceFilterList) {
        const missingParameters = await this.getMissingParameters(resourceFilterList);
        if (missingParameters.length > 0) {
            const missingParameterNames = missingParameters.map((param) => param.parameterName);
            const missingFullPaths = missingParameters.map(({ resourceName, categoryName, parameterName }) => getFullParameterStorePath(categoryName, resourceName, parameterName));
            const resolution = `Run 'amplify push' interactively to specify values.\n` +
                `Alternatively, manually add values in SSM ParameterStore for the following parameter names:\n\n` +
                `${missingFullPaths.join('\n')}\n`;
            throw new amplify_cli_core_1.AmplifyError('EnvironmentConfigurationError', {
                message: `This environment is missing some parameter values.`,
                details: `[${missingParameterNames}] ${missingParameterNames.length > 1 ? 'does' : 'do'} not have values.`,
                resolution,
                link: 'https://docs.amplify.aws/cli/reference/ssm-parameter-store/#manually-creating-parameters',
            });
        }
    }
    serializeTPICategories() {
        return Object.entries(this.resourceParamManagers).reduce((acc, [resourceKey, resourceParams]) => {
            lodash_1.default.setWith(acc, splitResourceKey(resourceKey), resourceParams.getAllParams(), Object);
            return acc;
        }, {});
    }
}
const getResourceKey = (category, resourceName) => `${category}_${resourceName}`;
const splitResourceKey = (key) => {
    const [category, resourceName] = key.split('_');
    return [category, resourceName];
};
const getFullParameterStorePath = (categoryName, resourceName, paramName) => `${amplify_cli_core_1.stateManager.getAppID()}/${amplify_cli_core_1.stateManager.getCurrentEnvName()}/${getParameterStoreKey(categoryName, resourceName, paramName)}`;
const getParameterStoreKey = (categoryName, resourceName, paramName) => `AMPLIFY_${categoryName}_${resourceName}_${paramName}`;
const getNamesFromParameterStoreKey = (fullParameter) => {
    const [, categoryName, resourceName] = fullParameter.split('_');
    const parameterName = fullParameter.split('_').slice(3).join('_');
    return [categoryName, resourceName, parameterName];
};
//# sourceMappingURL=environment-parameter-manager.js.map