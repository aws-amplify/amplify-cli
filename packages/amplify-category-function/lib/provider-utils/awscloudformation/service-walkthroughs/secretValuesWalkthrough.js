"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.secretValueValidator = exports.cloneEnvWalkthrough = exports.prePushMissingSecretsWalkthrough = exports.secretValuesWalkthrough = void 0;
const amplify_function_plugin_interface_1 = require("@aws-amplify/amplify-function-plugin-interface");
const inquirer_1 = __importDefault(require("inquirer"));
const secretDeltaUtilities_1 = require("../secrets/secretDeltaUtilities");
const environmentVariablesHelper_1 = require("../utils/environmentVariablesHelper");
const secretValuesWalkthroughDefaultOptions = {
    preConfirmed: false,
};
const secretValuesWalkthrough = async (secretDeltas, envVarNames = [], options = secretValuesWalkthroughDefaultOptions) => {
    options = { ...secretValuesWalkthroughDefaultOptions, ...options };
    if (!(await addSecretsConfirm(options.preConfirmed))) {
        return {};
    }
    let firstLoop = true;
    for (let operation = await selectOperation((0, secretDeltaUtilities_1.hasExistingSecrets)(secretDeltas), firstLoop); operation !== 'done'; operation = await selectOperation((0, secretDeltaUtilities_1.hasExistingSecrets)(secretDeltas), firstLoop)) {
        await operationFlowMap[operation](secretDeltas, envVarNames);
        firstLoop = false;
    }
    return { secretDeltas };
};
exports.secretValuesWalkthrough = secretValuesWalkthrough;
const prePushMissingSecretsWalkthrough = async (functionName, missingSecretNames) => {
    const secretDeltas = {};
    for (const secretName of missingSecretNames) {
        const secretValue = await enterSecretValue(`${secretName} in ${functionName} does not have a value in this environment. Specify one now:`);
        secretDeltas[secretName] = (0, amplify_function_plugin_interface_1.setSecret)(secretValue);
    }
    return secretDeltas;
};
exports.prePushMissingSecretsWalkthrough = prePushMissingSecretsWalkthrough;
const cloneEnvWalkthrough = async (interactive = true, deltas = {}) => {
    const carryOver = !interactive || (await carryOverPrompt());
    if (carryOver) {
        return deltas;
    }
    const funcList = Object.keys(deltas);
    for (let funcToUpdate = await selectFunctionToUpdate(funcList); funcToUpdate; funcToUpdate = await selectFunctionToUpdate(funcList)) {
        await (0, exports.secretValuesWalkthrough)(deltas[funcToUpdate], Object.keys((0, environmentVariablesHelper_1.getStoredEnvironmentVariables)(funcToUpdate)), { preConfirmed: true });
    }
    return deltas;
};
exports.cloneEnvWalkthrough = cloneEnvWalkthrough;
const addSecretFlow = async (secretDeltas, invalidNames = []) => {
    const secretName = await enterSecretName(Object.keys(secretDeltas).concat(invalidNames));
    const secretValue = await enterSecretValue(secretValueDefaultMessage(secretName));
    secretDeltas[secretName] = (0, amplify_function_plugin_interface_1.setSecret)(secretValue);
};
const updateSecretFlow = async (secretDeltas) => {
    const secretToUpdate = await singleSelectSecret(Object.keys((0, secretDeltaUtilities_1.getExistingSecrets)(secretDeltas)), 'Select the secret to update:');
    const secretValue = await enterSecretValue(secretValueDefaultMessage(secretToUpdate));
    secretDeltas[secretToUpdate] = (0, amplify_function_plugin_interface_1.setSecret)(secretValue);
};
const removeSecretFlow = async (secretDeltas) => {
    const secretsToRemove = await multiSelectSecret(Object.keys((0, secretDeltaUtilities_1.getExistingSecrets)(secretDeltas)), 'Select the secrets to delete:');
    secretsToRemove.forEach((secretName) => (secretDeltas[secretName] = amplify_function_plugin_interface_1.removeSecret));
};
const operationFlowMap = {
    add: addSecretFlow,
    update: updateSecretFlow,
    remove: removeSecretFlow,
};
const carryOverPrompt = async () => (await inquirer_1.default.prompt({
    type: 'list',
    name: 'carryOver',
    message: `You have configured secrets for functions. How do you want to proceed?`,
    choices: [
        {
            value: 'carry',
            name: 'Carry over existing secret values to the new environment',
        },
        {
            value: 'update',
            name: 'Update secret values now (you can always update secret values later using `amplify update function`)',
        },
    ],
})).carryOver === 'carry';
const selectFunctionToUpdate = async (funcNames) => (await inquirer_1.default.prompt({
    type: 'list',
    name: 'funcToUpdate',
    message: 'Select a function to update secrets for:',
    choices: funcNames
        .map((name) => ({ name, value: name }))
        .concat({ name: "I'm done", value: false }),
})).funcToUpdate;
const addSecretsConfirm = async (preConfirmed = false) => {
    if (preConfirmed) {
        return true;
    }
    return (await inquirer_1.default.prompt({
        type: 'confirm',
        name: 'confirm',
        message: 'Do you want to configure secret values this function can access?',
        default: false,
    })).confirm;
};
const validNameRegExp = /^[a-zA-Z0-9_]+$/;
const secretNameValidator = (invalidNames) => (input) => {
    if (!input || input.length === 0 || input.length > 2048) {
        return 'Secret name must be between 1 and 2048 characters long';
    }
    if (!validNameRegExp.test(input)) {
        return 'Secret names can only use alphanumeric characters and underscore';
    }
    if (invalidNames.includes(input)) {
        return `${input} is an existing secret name or environment variable name. All secrets must have a unique name.`;
    }
    return true;
};
const enterSecretName = async (invalidNames) => (await inquirer_1.default.prompt({
    type: 'input',
    name: 'secretName',
    message: 'Enter a secret name (this is the key used to look up the secret value):',
    validate: secretNameValidator(invalidNames),
})).secretName;
const secretValueDefaultMessage = (secretName) => `Enter the value for ${secretName}:`;
const secretValueValidator = (input) => {
    if (typeof input !== 'string' || input.length === 0 || input.length > 2048) {
        return 'Secret value must be between 1 and 2048 characters long';
    }
    return true;
};
exports.secretValueValidator = secretValueValidator;
const enterSecretValue = async (message) => (await inquirer_1.default.prompt({
    type: 'password',
    name: 'secretValue',
    message,
    validate: exports.secretValueValidator,
})).secretValue;
const singleSelectSecret = async (existingSecretNames, message) => (await inquirer_1.default.prompt({
    type: 'list',
    name: 'secretName',
    message,
    choices: existingSecretNames,
})).secretName;
const multiSelectSecret = async (existingSecretNames, message) => (await inquirer_1.default.prompt({
    type: 'checkbox',
    name: 'secretNames',
    message,
    choices: existingSecretNames,
})).secretNames;
const selectOperation = async (hasExistingSecrets, firstLoop) => {
    if (!hasExistingSecrets && firstLoop) {
        return 'add';
    }
    return (await inquirer_1.default.prompt({
        type: 'list',
        name: 'operation',
        message: 'What do you want to do?',
        choices: [
            {
                name: 'Add a secret',
                value: 'add',
            },
            {
                name: 'Update a secret',
                value: 'update',
                disabled: !hasExistingSecrets,
            },
            {
                name: 'Remove secrets',
                value: 'remove',
                disabled: !hasExistingSecrets,
            },
            {
                name: "I'm done",
                value: 'done',
            },
        ],
        default: firstLoop ? 'add' : 'done',
    })).operation;
};
//# sourceMappingURL=secretValuesWalkthrough.js.map