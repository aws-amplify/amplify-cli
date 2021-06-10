/**
 * This module contains utility functions for dealing with the SecretDeltas object
 */

import { removeSecretCloud, removeSecretLocal, retainSecret, SecretDelta, SecretDeltas } from 'amplify-function-plugin-interface';

/**
 * Determines if the SecretDeltas have any existing secrets (aka they are not marked for removal)
 */
export const hasExistingSecrets = (secretDeltas: SecretDeltas) =>
  Object.values(secretDeltas).filter(existingSecretDeltaPredicate).length > 0;

/**
 * Get the subset of SecretDeltas of secrets that exist (not marked for removal)
 */
export const getExistingSecrets = (secretDeltas: SecretDeltas) =>
  Object.entries(secretDeltas)
    .filter(([_, delta]) => existingSecretDeltaPredicate(delta))
    .reduce((acc, [secretName, secretDelta]) => ({ ...acc, [secretName]: secretDelta }), {} as SecretDeltas);

/**
 * Convert a list of secret names into a SecretDeltas object with the specified delta applied to each secret
 */
export const secretNamesToSecretDeltas = (secretNames: string[], delta: SecretDelta = retainSecret): SecretDeltas =>
  secretNames.reduce((acc, secretName) => ({ ...acc, [secretName]: delta }), {} as SecretDeltas);

const existingSecretDeltaPredicate = (secretDelta: SecretDelta) =>
  !([removeSecretLocal.operation, removeSecretCloud.operation] as SecretDelta['operation'][]).includes(secretDelta.operation);
