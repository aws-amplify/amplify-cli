import { removeSecretCloud, removeSecretLocal, retainSecret, SecretDelta, SecretDeltas } from 'amplify-function-plugin-interface';

export const hasExistingSecrets = (secretDeltas: SecretDeltas) =>
  Object.values(secretDeltas).filter(existingSecretDeltaPredicate).length > 0;

export const getExistingSecrets = (secretDeltas: SecretDeltas) =>
  Object.entries(secretDeltas)
    .filter(([_, delta]) => existingSecretDeltaPredicate(delta))
    .reduce((acc, [secretName, secretDelta]) => ({ ...acc, [secretName]: secretDelta }), {} as SecretDeltas);

export const secretNamesToSecretDeltas = (secretNames: string[], delta: SecretDelta = retainSecret): SecretDeltas =>
  secretNames.reduce((acc, secretName) => ({ ...acc, [secretName]: delta }), {} as SecretDeltas);

const existingSecretDeltaPredicate = (secretDelta: SecretDelta) =>
  !([removeSecretLocal.operation, removeSecretCloud.operation] as SecretDelta['operation'][]).includes(secretDelta.operation);
