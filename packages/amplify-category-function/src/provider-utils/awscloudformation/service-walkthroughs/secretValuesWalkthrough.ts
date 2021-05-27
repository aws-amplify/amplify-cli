import { FunctionParameters, retainSecret, SecretDeltas } from 'amplify-function-plugin-interface';
import inquirer from 'inquirer';

/**
 * Walkthrough for adding secret values for a function
 * @param context The Amplify context object
 */
export const secretValuesWalkthrough = async (existingSecretNames: string[]): Promise<Pick<FunctionParameters, 'secretDeltas'>> => {
  const secretDeltas = existingSecretNames.reduce((acc, secretName) => ({ ...acc, [secretName]: retainSecret }), {} as SecretDeltas);
  if (!(await addSecretsConfirm())) {
    return { secretDeltas };
  }

  for (
    let operation = await selectOperation(hasExistingSecrets(secretDeltas));
    operation !== 'done';
    operation = await selectOperation(hasExistingSecrets(secretDeltas))
  ) {
    await operationFlowMap[operation](secretDeltas);
  }
  return { secretDeltas };
};

const hasExistingSecrets = (secretDeltas: SecretDeltas) => Object.keys(secretDeltas).length > 0;

type SecretDeltasModifier = (secretDeltas: SecretDeltas) => Promise<void>;

const addSecretFlow = async (secretDeltas: SecretDeltas) => {
  const secretName = await enterSecretName(Object.keys(secretDeltas));
  const secretValue = await enterSecretValue(secretName);
  secretDeltas[secretName] = { operation: 'setValue', value: secretValue };
};

const updateSecretFlow = async (secretDeltas: SecretDeltas) => {
  const secretToUpdate = await singleSelectSecret(Object.keys(secretDeltas), 'Select the secret to update:');
  const secretValue = await enterSecretValue(secretToUpdate);
  secretDeltas[secretToUpdate] = { operation: 'setValue', value: secretValue };
};

const removeSecretFlow = async (secretDeltas: SecretDeltas) => {
  const secretsToRemove = await multiSelectSecret(Object.keys(secretDeltas), 'Select the secrets to delete:');
  secretsToRemove.forEach(secretName => (secretDeltas[secretName] = { operation: 'remove' }));
};

const operationFlowMap: Record<Exclude<SecretOperation, 'done'>, SecretDeltasModifier> = {
  add: addSecretFlow,
  update: updateSecretFlow,
  remove: removeSecretFlow,
};

const addSecretsConfirm = async () =>
  (
    await inquirer.prompt<{ confirm: boolean }>({
      type: 'confirm',
      name: 'confirm',
      message: 'Do you want to configure secret values this function can access?',
      default: false,
    })
  ).confirm;

const secretNameValidator = (existingSecretNames: string[]) => (input?: string) => {
  if (input && input.length > 0 && input.length <= 2048) {
    if (existingSecretNames.includes(input)) {
      return `${input} is an existing secret name. All secrets must have a unique name.`;
    }
    return true;
  } else {
    return 'Secret name must be between 1 and 2048 characters long';
  }
};

const enterSecretName = async (existingSecretNames: string[]) =>
  (
    await inquirer.prompt<{ secretName: string }>({
      type: 'input',
      name: 'secretName',
      message: 'Enter a secret name (this is the key used to look up the secret value):',
      validate: secretNameValidator(existingSecretNames),
    })
  ).secretName;

const enterSecretValue = async (secretName: string) =>
  (
    await inquirer.prompt<{ secretValue: string }>({
      type: 'password',
      name: 'secretValue',
      message: `Enter the value for ${secretName}:`,
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

const selectOperation = async (hasExistingSecrets: boolean) =>
  (
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
          name: 'Delete secrets',
          value: 'delete',
          disabled: !hasExistingSecrets,
        },
        {
          name: "I'm done",
          value: 'done',
        },
      ],
    })
  ).operation;

type SecretOperation = 'add' | 'update' | 'remove' | 'done';
