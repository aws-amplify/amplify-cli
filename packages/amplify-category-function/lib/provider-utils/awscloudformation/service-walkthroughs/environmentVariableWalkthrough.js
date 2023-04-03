"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askEnvironmentVariableQuestions = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const lodash_1 = __importDefault(require("lodash"));
const environmentVariablesHelper_1 = require("../utils/environmentVariablesHelper");
const functionSecretsStateManager_1 = require("../secrets/functionSecretsStateManager");
const askEnvironmentVariableQuestions = async (resourceName, environmentVariables, skipWalkthrough) => {
    if (!environmentVariables) {
        environmentVariables = await (0, environmentVariablesHelper_1.getStoredEnvironmentVariables)(resourceName);
    }
    let firstLoop = true;
    for (let operation = skipWalkthrough ? 'abort' : await selectEnvironmentVariableQuestion(lodash_1.default.size(environmentVariables) > 0, firstLoop); operation !== 'abort'; operation = await selectEnvironmentVariableQuestion(lodash_1.default.size(environmentVariables) > 0, firstLoop)) {
        switch (operation) {
            case 'add': {
                const { newEnvironmentVariableKey, newEnvironmentVariableValue } = await addEnvironmentVariableQuestion(environmentVariables, (0, functionSecretsStateManager_1.getLocalFunctionSecretNames)(resourceName));
                environmentVariables[newEnvironmentVariableKey] = newEnvironmentVariableValue;
                break;
            }
            case 'update': {
                const { newEnvironmentVariableKey, newEnvironmentVariableValue, targetedKey } = await updateEnvironmentVariableQuestion(environmentVariables, (0, functionSecretsStateManager_1.getLocalFunctionSecretNames)(resourceName));
                delete environmentVariables[targetedKey];
                environmentVariables[newEnvironmentVariableKey] = newEnvironmentVariableValue;
                break;
            }
            case 'remove': {
                const targetedKey = await removeEnvironmentVariableQuestion(environmentVariables);
                delete environmentVariables[targetedKey];
                break;
            }
            default:
        }
        firstLoop = false;
    }
    return {
        environmentMap: Object.keys(environmentVariables).reduce((acc, cur) => ({
            ...acc,
            [cur]: { Ref: lodash_1.default.camelCase(cur) },
        }), {}),
        environmentVariables,
    };
};
exports.askEnvironmentVariableQuestions = askEnvironmentVariableQuestions;
const selectEnvironmentVariableQuestion = async (hasExistingEnvVars, firstLoop) => {
    if (!hasExistingEnvVars && firstLoop) {
        return 'add';
    }
    const { operation } = await inquirer_1.default.prompt([
        {
            name: 'operation',
            message: 'Select what you want to do with environment variables:',
            type: 'list',
            choices: [
                {
                    value: 'add',
                    name: 'Add new environment variable',
                },
                {
                    value: 'update',
                    name: 'Update existing environment variables',
                    disabled: !hasExistingEnvVars,
                },
                {
                    value: 'remove',
                    name: 'Remove existing environment variables',
                    disabled: !hasExistingEnvVars,
                },
                {
                    value: 'abort',
                    name: "I'm done",
                },
            ],
            default: firstLoop ? 'add' : 'abort',
        },
    ]);
    return operation;
};
const addEnvironmentVariableQuestion = async (environmentVariables, secretNames) => {
    const { newEnvironmentVariableKey, newEnvironmentVariableValue } = await inquirer_1.default.prompt([
        {
            name: 'newEnvironmentVariableKey',
            message: 'Enter the environment variable name:',
            type: 'input',
            validate: (input) => {
                if (!environmentVariablesHelper_1.validKey.test(input)) {
                    return 'You can use the following characters: a-z A-Z 0-9 _';
                }
                if (lodash_1.default.has(environmentVariables, input) || secretNames.includes(input)) {
                    return `Key "${input}" is already used`;
                }
                return true;
            },
        },
        {
            name: 'newEnvironmentVariableValue',
            message: 'Enter the environment variable value:',
            type: 'input',
            validate: envVarValueValidator,
        },
    ]);
    return {
        newEnvironmentVariableKey,
        newEnvironmentVariableValue,
    };
};
const updateEnvironmentVariableQuestion = async (environmentVariables, secretNames = []) => {
    const { targetedKey } = await inquirer_1.default.prompt([
        {
            name: 'targetedKey',
            message: 'Which environment variable do you want to update:',
            type: 'list',
            choices: Object.keys(environmentVariables),
        },
    ]);
    const { newEnvironmentVariableKey, newEnvironmentVariableValue } = await inquirer_1.default.prompt([
        {
            name: 'newEnvironmentVariableKey',
            message: 'Enter the environment variable name:',
            type: 'input',
            validate: (input) => {
                if (!environmentVariablesHelper_1.validKey.test(input)) {
                    return 'You can use the following characters: a-z A-Z 0-9 _';
                }
                if ((lodash_1.default.has(environmentVariables, input) && input !== targetedKey) || secretNames.includes(input)) {
                    return `Key "${input}" is already used.`;
                }
                return true;
            },
            default: targetedKey,
        },
        {
            name: 'newEnvironmentVariableValue',
            message: 'Enter the environment variable value:',
            type: 'input',
            validate: envVarValueValidator,
            default: environmentVariables[targetedKey],
        },
    ]);
    return {
        newEnvironmentVariableKey,
        newEnvironmentVariableValue,
        targetedKey,
    };
};
const removeEnvironmentVariableQuestion = async (environmentVariables) => {
    const { targetedKey } = await inquirer_1.default.prompt([
        {
            name: 'targetedKey',
            message: 'Which environment variable do you want to remove:',
            type: 'list',
            choices: Object.keys(environmentVariables),
        },
    ]);
    return targetedKey;
};
const envVarValueValidator = (input) => {
    if (input.length < 1 || input.length > 2048) {
        return 'The value must be between 1 and 2048 characters long';
    }
    return true;
};
//# sourceMappingURL=environmentVariableWalkthrough.js.map