import { SecretDeltas } from 'amplify-function-plugin-interface';

export const hasExistingSecrets = (secretDeltas: SecretDeltas) =>
  Object.values(secretDeltas).filter(delta => delta.operation !== 'remove').length > 0;

export const getExistingSecrets = (secretDeltas: SecretDeltas) =>
  Object.entries(secretDeltas)
    .filter(([_, delta]) => delta.operation !== 'remove')
    .reduce((acc, [secretName, secretDelta]) => ({ ...acc, [secretName]: secretDelta }), {} as SecretDeltas);
