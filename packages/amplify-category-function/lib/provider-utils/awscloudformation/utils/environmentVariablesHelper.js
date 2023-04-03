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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureEnvironmentVariableValues = exports.askEnvironmentVariableCarryOrUpdateQuestions = exports.saveEnvironmentVariables = exports.getStoredEnvironmentVariables = exports.validKey = void 0;
const path_1 = __importDefault(require("path"));
const lodash_1 = __importDefault(require("lodash"));
const uuid = __importStar(require("uuid"));
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const constants_1 = require("./constants");
const constants_2 = require("../../../constants");
exports.validKey = new RegExp(/^[a-zA-Z0-9_]+$/);
const getStoredEnvironmentVariables = (resourceName, currentEnvName) => {
    const storedList = getStoredList(resourceName);
    const storedReferences = getStoredReferences(resourceName);
    const storedParameters = getStoredParameters(resourceName);
    const storedKeyValue = getStoredKeyValue(resourceName, currentEnvName);
    const environmentVariables = {};
    storedList.forEach(({ environmentVariableName, cloudFormationParameterName }) => {
        var _a;
        if (!environmentVariableName)
            return;
        if (!cloudFormationParameterName)
            return;
        if (!storedParameters[cloudFormationParameterName])
            return;
        if (((_a = storedReferences[environmentVariableName]) === null || _a === void 0 ? void 0 : _a.Ref) !== cloudFormationParameterName)
            return;
        if (!lodash_1.default.has(storedKeyValue, cloudFormationParameterName))
            return;
        environmentVariables[environmentVariableName] = storedKeyValue[cloudFormationParameterName];
    });
    return environmentVariables;
};
exports.getStoredEnvironmentVariables = getStoredEnvironmentVariables;
const saveEnvironmentVariables = (resourceName, newEnvironmentVariables) => {
    const currentEnvironmentVariables = (0, exports.getStoredEnvironmentVariables)(resourceName);
    lodash_1.default.each(currentEnvironmentVariables, (__, key) => {
        deleteEnvironmentVariable(resourceName, key);
    });
    lodash_1.default.each(newEnvironmentVariables, (value, key) => {
        setEnvironmentVariable(resourceName, key, value);
    });
};
exports.saveEnvironmentVariables = saveEnvironmentVariables;
const askEnvironmentVariableCarryOrUpdateQuestions = async (context, fromEnvName, yesFlagSet) => {
    var _a, _b, _c;
    await (0, amplify_environment_parameters_1.ensureEnvParamManager)(fromEnvName);
    await (0, amplify_environment_parameters_1.ensureEnvParamManager)();
    const functionNames = Object.keys((_a = amplify_cli_core_1.stateManager.getBackendConfig()) === null || _a === void 0 ? void 0 : _a.function);
    if (functionNames.length === 0) {
        return;
    }
    const hasEnvVars = !!functionNames.find((funcName) => !lodash_1.default.isEmpty((0, exports.getStoredEnvironmentVariables)(funcName, fromEnvName)));
    if (!hasEnvVars) {
        return;
    }
    functionNames.forEach((funcName) => {
        (0, amplify_environment_parameters_1.getEnvParamManager)()
            .getResourceParamManager(constants_2.categoryName, funcName)
            .setAllParams((0, amplify_environment_parameters_1.getEnvParamManager)(fromEnvName).getResourceParamManager(constants_2.categoryName, funcName).getAllParams());
    });
    if ((_c = (_b = context.parameters) === null || _b === void 0 ? void 0 : _b.options) === null || _c === void 0 ? void 0 : _c.quickstart)
        return;
    if (yesFlagSet)
        return;
    await askEnvVarCarryOrUpdateQuestion(functionNames, fromEnvName);
};
exports.askEnvironmentVariableCarryOrUpdateQuestions = askEnvironmentVariableCarryOrUpdateQuestions;
const askEnvVarCarryOrUpdateQuestion = async (functionNames, fromEnvName) => {
    const choices = [
        {
            value: 'carry',
            name: 'Carry over existing environment variables to this new environment',
        },
        {
            value: 'update',
            name: 'Update environment variables now',
        },
    ];
    const envVarOperation = await amplify_prompts_1.prompter.pick('You have configured environment variables for functions. How do you want to proceed?', choices, {
        initial: (0, amplify_prompts_1.byValue)('carry'),
    });
    if (envVarOperation === 'update') {
        await selectFunctionToUpdateValuesFor(functionNames, fromEnvName);
    }
    return;
};
const selectFunctionToUpdateValuesFor = async (functionNames, fromEnvName) => {
    const abortKey = uuid.v4();
    const choices = functionNames
        .map((name) => ({
        name,
        value: name,
    }))
        .concat({
        name: "I'm done",
        value: abortKey,
    });
    const functionName = await amplify_prompts_1.prompter.pick('Select the Lambda function you want to update values', choices);
    if (functionName === abortKey)
        return;
    await selectEnvironmentVariableToUpdate(functionNames, fromEnvName, functionName);
};
const selectEnvironmentVariableToUpdate = async (functionNames, fromEnvName, functionName) => {
    const envVars = (0, exports.getStoredEnvironmentVariables)(functionName, fromEnvName);
    const abortKey = uuid.v4();
    const choices = Object.keys(envVars)
        .map((name) => ({
        name,
        value: name,
    }))
        .concat({
        name: "I'm done",
        value: abortKey,
    });
    const keyName = await amplify_prompts_1.prompter.pick("Which function's environment variables do you want to edit?", choices);
    if (keyName === abortKey) {
        await selectFunctionToUpdateValuesFor(functionNames, fromEnvName);
        return;
    }
    await askForEnvironmentVariableValue(functionNames, fromEnvName, functionName, keyName);
};
const askForEnvironmentVariableValue = async (functionNames, fromEnvName, functionName, keyName) => {
    const envVars = (0, exports.getStoredEnvironmentVariables)(functionName, fromEnvName);
    const newValue = await amplify_prompts_1.prompter.input('Enter the environment variable value:', {
        initial: envVars[keyName],
        validate: (0, amplify_prompts_1.maxLength)(2048, 'The value must be 2048 characters or less'),
    });
    (0, amplify_environment_parameters_1.getEnvParamManager)().getResourceParamManager(constants_2.categoryName, functionName).setParam(lodash_1.default.camelCase(keyName), newValue);
    await selectEnvironmentVariableToUpdate(functionNames, fromEnvName, functionName);
};
const ensureEnvironmentVariableValues = async (context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const yesFlagSet = ((_b = (_a = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _a === void 0 ? void 0 : _a.inputParams) === null || _b === void 0 ? void 0 : _b.yes) || ((_d = (_c = context === null || context === void 0 ? void 0 : context.input) === null || _c === void 0 ? void 0 : _c.options) === null || _d === void 0 ? void 0 : _d.yes);
    const currentEnvName = amplify_cli_core_1.stateManager.localEnvInfoExists()
        ? (_e = amplify_cli_core_1.stateManager.getLocalEnvInfo()) === null || _e === void 0 ? void 0 : _e.envName
        : (_h = (_g = (_f = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _f === void 0 ? void 0 : _f.inputParams) === null || _g === void 0 ? void 0 : _g.amplify) === null || _h === void 0 ? void 0 : _h.envName;
    await (0, amplify_environment_parameters_1.ensureEnvParamManager)(currentEnvName);
    const functionNames = Object.keys(((_j = amplify_cli_core_1.stateManager.getBackendConfig()) === null || _j === void 0 ? void 0 : _j.function) || {});
    if (functionNames.length === 0) {
        return;
    }
    const functionConfigMissingEnvVars = functionNames
        .map((funcName) => {
        const storedList = getStoredList(funcName);
        const keyValues = getStoredKeyValue(funcName, currentEnvName);
        return {
            funcName,
            existingKeyValues: keyValues,
            missingEnvVars: storedList.filter(({ cloudFormationParameterName: keyName }) => !keyValues[keyName]),
        };
    })
        .filter((envVars) => envVars.missingEnvVars.length);
    if (lodash_1.default.isEmpty(functionConfigMissingEnvVars)) {
        return;
    }
    if (yesFlagSet) {
        const errMessage = `Cannot push Amplify environment "${currentEnvName}" due to missing Lambda function environment variable values. Rerun 'amplify push' without '--yes' to fix.`;
        amplify_prompts_1.printer.error(errMessage);
        const missingEnvVarsMessage = functionConfigMissingEnvVars.map(({ missingEnvVars, funcName }) => {
            const missingEnvVarsString = missingEnvVars.map((missing) => missing.environmentVariableName).join(', ');
            return `Function ${funcName} is missing values for environment variables: ${missingEnvVarsString}`;
        });
        amplify_prompts_1.formatter.list(missingEnvVarsMessage);
        await context.usageData.emitError(new Error(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(1);
    }
    amplify_prompts_1.printer.info('Some Lambda function environment variables are missing values in this Amplify environment.');
    for (const { funcName, existingKeyValues: keyValues, missingEnvVars } of functionConfigMissingEnvVars) {
        for (const { cloudFormationParameterName: cfnName, environmentVariableName: envVarName } of missingEnvVars) {
            const newValue = await amplify_prompts_1.prompter.input(`Enter the missing environment variable value of ${envVarName} in ${funcName}:`, {
                validate: (0, amplify_prompts_1.maxLength)(2048),
            });
            keyValues[cfnName] = newValue;
        }
        setStoredKeyValue(funcName, keyValues, currentEnvName);
    }
};
exports.ensureEnvironmentVariableValues = ensureEnvironmentVariableValues;
const setEnvironmentVariable = (resourceName, newEnvironmentVariableKey, newEnvironmentVariableValue) => {
    const newList = getStoredList(resourceName);
    const newReferences = getStoredReferences(resourceName);
    const newParameters = getStoredParameters(resourceName);
    const newKeyValue = getStoredKeyValue(resourceName);
    const camelCaseKey = lodash_1.default.camelCase(newEnvironmentVariableKey);
    newList.push({
        cloudFormationParameterName: camelCaseKey,
        environmentVariableName: newEnvironmentVariableKey,
    });
    newReferences[newEnvironmentVariableKey] = { Ref: camelCaseKey };
    newParameters[camelCaseKey] = { Type: 'String' };
    newKeyValue[camelCaseKey] = newEnvironmentVariableValue;
    setStoredList(resourceName, newList);
    setStoredReference(resourceName, newReferences);
    setStoredParameters(resourceName, newParameters);
    setStoredKeyValue(resourceName, newKeyValue);
};
const deleteEnvironmentVariable = (resourceName, targetedKey) => {
    let newList = getStoredList(resourceName);
    const newReferences = getStoredReferences(resourceName);
    const newKeyValue = getStoredKeyValue(resourceName);
    const newParameters = getStoredParameters(resourceName);
    const camelCaseKey = lodash_1.default.camelCase(targetedKey);
    newList = lodash_1.default.filter(newList, (item) => item.cloudFormationParameterName !== camelCaseKey && item.environmentVariableName !== targetedKey);
    lodash_1.default.unset(newReferences, targetedKey);
    lodash_1.default.unset(newParameters, camelCaseKey);
    lodash_1.default.unset(newKeyValue, camelCaseKey);
    setStoredList(resourceName, newList);
    setStoredReference(resourceName, newReferences);
    setStoredParameters(resourceName, newParameters);
    setStoredKeyValue(resourceName, newKeyValue);
};
const getStoredList = (resourceName) => {
    const projectBackendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath();
    const resourcePath = path_1.default.join(projectBackendDirPath, constants_2.categoryName, resourceName);
    const functionParameterFilePath = path_1.default.join(resourcePath, constants_1.functionParametersFileName);
    const functionParameters = amplify_cli_core_1.JSONUtilities.readJson(functionParameterFilePath, { throwIfNotExist: false }) || {};
    return lodash_1.default.get(functionParameters, 'environmentVariableList', []);
};
const setStoredList = (resourceName, newList) => {
    const projectBackendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath();
    const resourcePath = path_1.default.join(projectBackendDirPath, constants_2.categoryName, resourceName);
    const functionParameterFilePath = path_1.default.join(resourcePath, constants_1.functionParametersFileName);
    const functionParameters = amplify_cli_core_1.JSONUtilities.readJson(functionParameterFilePath, { throwIfNotExist: false }) || {};
    lodash_1.default.setWith(functionParameters, 'environmentVariableList', newList);
    amplify_cli_core_1.JSONUtilities.writeJson(functionParameterFilePath, functionParameters);
};
const getStoredReferences = (resourceName) => {
    const projectBackendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath();
    const resourcePath = path_1.default.join(projectBackendDirPath, constants_2.categoryName, resourceName);
    const cfnFileName = `${resourceName}-cloudformation-template.json`;
    const cfnFilePath = path_1.default.join(resourcePath, cfnFileName);
    const cfnContent = amplify_cli_core_1.JSONUtilities.readJson(cfnFilePath, { throwIfNotExist: false }) || {};
    return lodash_1.default.get(cfnContent, ['Resources', 'LambdaFunction', 'Properties', 'Environment', 'Variables'], {});
};
const setStoredReference = (resourceName, newReferences) => {
    const projectBackendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath();
    const resourcePath = path_1.default.join(projectBackendDirPath, constants_2.categoryName, resourceName);
    const cfnFileName = `${resourceName}-cloudformation-template.json`;
    const cfnFilePath = path_1.default.join(resourcePath, cfnFileName);
    const cfnContent = amplify_cli_core_1.JSONUtilities.readJson(cfnFilePath, { throwIfNotExist: false }) || {};
    lodash_1.default.setWith(cfnContent, ['Resources', 'LambdaFunction', 'Properties', 'Environment', 'Variables'], newReferences);
    amplify_cli_core_1.JSONUtilities.writeJson(cfnFilePath, cfnContent);
};
const getStoredParameters = (resourceName) => {
    const projectBackendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath();
    const resourcePath = path_1.default.join(projectBackendDirPath, constants_2.categoryName, resourceName);
    const cfnFileName = `${resourceName}-cloudformation-template.json`;
    const cfnFilePath = path_1.default.join(resourcePath, cfnFileName);
    const cfnContent = amplify_cli_core_1.JSONUtilities.readJson(cfnFilePath, { throwIfNotExist: false }) || {};
    return lodash_1.default.get(cfnContent, ['Parameters'], {});
};
const setStoredParameters = (resourceName, newParameters) => {
    const projectBackendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath();
    const resourcePath = path_1.default.join(projectBackendDirPath, constants_2.categoryName, resourceName);
    const cfnFileName = `${resourceName}-cloudformation-template.json`;
    const cfnFilePath = path_1.default.join(resourcePath, cfnFileName);
    const cfnContent = amplify_cli_core_1.JSONUtilities.readJson(cfnFilePath, { throwIfNotExist: false }) || {};
    lodash_1.default.setWith(cfnContent, ['Parameters'], newParameters);
    amplify_cli_core_1.JSONUtilities.writeJson(cfnFilePath, cfnContent);
};
const getStoredKeyValue = (resourceName, envName) => (0, amplify_environment_parameters_1.getEnvParamManager)(envName).getResourceParamManager(constants_2.categoryName, resourceName).getAllParams();
const setStoredKeyValue = (resourceName, newKeyValue, envName) => {
    (0, amplify_environment_parameters_1.getEnvParamManager)(envName).getResourceParamManager(constants_2.categoryName, resourceName).setAllParams(newKeyValue);
};
//# sourceMappingURL=environmentVariablesHelper.js.map