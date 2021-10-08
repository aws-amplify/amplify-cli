/**
 * Contains all of the logic for the various secret prompts
 */

import { ResourceName } from 'amplify-cli-core';
import { FunctionParameters, removeSecret, SecretDeltas, setSecret } from 'amplify-function-plugin-interface';
import inquirer from 'inquirer';
import { getExistingSecrets, hasExistingSecrets } from '../secrets/secretDeltaUtilities';
import { getStoredEnvironmentVariables } from '../utils/environmentVariablesHelper';

const secretValuesWalkthroughDefaultOptions = {
  preConfirmed: false, // true if the walkthrough has previously confirmed that secrets should be configured. false if this function should gate the flow behind a confirmation
};
/**
 * Walkthrough loop for adding secret values for a function
 * @param secretDeltas Object describing the existing secrets diff for the function. This object will be modified by this function
 * @param options Other options for controlling the behavior of the function
 * @returns
 */
export const secretValuesWalkthrough = async (
  secretDeltas: SecretDeltas,
  envVarNames: string[] = [], // env var names must be excluded from valid secret names because it will cause an env var collision in the lambda function
  options: Partial<typeof secretValuesWalkthroughDefaultOptions> = secretValuesWalkthroughDefaultOptions,
): Promise<Pick<FunctionParameters, 'secretDeltas'>> => {
  options = { ...secretValuesWalkthroughDefaultOptions, ...options };
  if (!(await addSecretsConfirm(options.preConfirmed))) {
    return {};
  }
  let firstLoop = true;
  for (
    let operation = await selectOperation(hasExistingSecrets(secretDeltas), firstLoop);
    operation !== 'done';
    operation = await selectOperation(hasExistingSecrets(secretDeltas), firstLoop)
  ) {
    await operationFlowMap[operation](secretDeltas, envVarNames);
    firstLoop = false;
  }
  return { secretDeltas };
};

/**
 * Walkthrough for resolving secrets that are defined locally but not present in the cloud on push
 * @param functionName The function name
 * @param missingSecretNames The secrets that are missing in the cloud
 * @returns A SecretDeltas object defining the updates to make
 */
export const prePushMissingSecretsWalkthrough = async (functionName: string, missingSecretNames: string[]): Promise<SecretDeltas> => {
  const secretDeltas: SecretDeltas = {};
  for (const secretName of missingSecretNames) {
    const secretValue = await enterSecretValue(
      `${secretName} in ${functionName} does not have a value in this environment. Specify one now:`,
    );
    secretDeltas[secretName] = setSecret(secretValue);
  }
  return secretDeltas;
};

/**
 * Walkthrough for updating secrets when adding a new env
 * @param interactive Whether or not prompts can be shown
 * @param deltas A map of resource name to SecretDeltas defining the default secret values for the new env. This object will be modified in place.
 * @returns The updated deltas object
 */
export const cloneEnvWalkthrough = async (
  interactive = true,
  deltas: Record<ResourceName, SecretDeltas> = {},
): Promise<Record<ResourceName, SecretDeltas>> => {
  const carryOver = !interactive || (await carryOverPrompt());
  if (carryOver) {
    return deltas;
  }

  const funcList = Object.keys(deltas);
  for (let funcToUpdate = await selectFunctionToUpdate(funcList); !!funcToUpdate; funcToUpdate = await selectFunctionToUpdate(funcList)) {
    await secretValuesWalkthrough(deltas[funcToUpdate], Object.keys(getStoredEnvironmentVariables(funcToUpdate)), { preConfirmed: true });
  }

  return deltas;
};

type SecretDeltasModifier = (secretDeltas: SecretDeltas, invalidNames?: string[]) => Promise<void>;

const addSecretFlow = async (secretDeltas: SecretDeltas, invalidNames: string[] = []) => {
  const secretName = await enterSecretName(Object.keys(secretDeltas).concat(invalidNames));
  const secretValue = await enterSecretValue(secretValueDefaultMessage(secretName));
  secretDeltas[secretName] = setSecret(secretValue);
};

const updateSecretFlow = async (secretDeltas: SecretDeltas) => {
  const secretToUpdate = await singleSelectSecret(Object.keys(getExistingSecrets(secretDeltas)), 'Select the secret to update:');
  const secretValue = await enterSecretValue(secretValueDefaultMessage(secretToUpdate));
  secretDeltas[secretToUpdate] = setSecret(secretValue);
};

const removeSecretFlow = async (secretDeltas: SecretDeltas) => {
  const secretsToRemove = await multiSelectSecret(Object.keys(getExistingSecrets(secretDeltas)), 'Select the secrets to delete:');
  secretsToRemove.forEach(secretName => (secretDeltas[secretName] = removeSecret));
};

const operationFlowMap: Record<Exclude<SecretOperation, 'done'>, SecretDeltasModifier> = {
  add: addSecretFlow,
  update: updateSecretFlow,
  remove: removeSecretFlow,
};

const carryOverPrompt = async () =>
  (
    await inquirer.prompt<{ carryOver: 'carry' | 'update' }>({
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
    })
  ).carryOver === 'carry';

const selectFunctionToUpdate = async (funcNames: string[]) =>
  (
    await inquirer.prompt({
      type: 'list',
      name: 'funcToUpdate',
      message: 'Select a function to update secrets for:',
      choices: funcNames
        .map(name => ({ name, value: name } as { name: string; value: string | false }))
        .concat({ name: "I'm done", value: false }),
    })
  ).funcToUpdate as string | false;

const addSecretsConfirm = async (preConfirmed: boolean = false) => {
  if (preConfirmed) {
    return true;
  }

  return (
    await inquirer.prompt<{ confirm: boolean }>({
      type: 'confirm',
      name: 'confirm',
      message: 'Do you want to configure secret values this function can access?',
      default: false,
    })
  ).confirm;
};

const validNameRegExp = /^[a-zA-Z0-9_]+$/;

const secretNameValidator = (invalidNames: string[]) => (input?: string) => {
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

const enterSecretName = async (invalidNames: string[]) =>
  (
    await inquirer.prompt<{ secretName: string }>({
      type: 'input',
      name: 'secretName',
      message: 'Enter a secret name (this is the key used to look up the secret value):',
      validate: secretNameValidator(invalidNames),
    })
  ).secretName;

const secretValueDefaultMessage = (secretName: string) => `Enter the value for ${secretName}:`;

const enterSecretValue = async (message: string) =>
  (
    await inquirer.prompt<{ secretValue: string }>({
      type: 'password',
      name: 'secretValue',
      message,
    })
  ).secretValue;

const singleSelectSecret = async (existingSecretNames: string[], message: string) =>
  (
    await inquirer.prompt<{ secretName: string }>({
      type: 'list',
      name: 'secretName',
      message,
      choices: existingSecretNames,
    })
  ).secretName;

const multiSelectSecret = async (existingSecretNames: string[], message: string) =>
  (
    await inquirer.prompt<{ secretNames: string[] }>({
      type: 'checkbox',
      name: 'secretNames',
      message,
      choices: existingSecretNames,
    })
  ).secretNames;

const selectOperation = async (hasExistingSecrets: boolean, firstLoop: boolean): Promise<SecretOperation> => {
  if (!hasExistingSecrets && firstLoop) {
    return 'add';
  }

  return (
    await inquirer.prompt<{ operation: SecretOperation }>({
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
    })
  ).operation;
};

type SecretOperation = 'add' | 'update' | 'remove' | 'done';
