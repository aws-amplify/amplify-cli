import { $TSContext, ResourceName, stateManager } from 'amplify-cli-core';
import { SecretDeltas } from 'amplify-function-plugin-interface';
import _ from 'lodash';
import { categoryName } from '../../../constants';
import { cloneEnvWalkthrough } from '../service-walkthroughs/secretValuesWalkthrough';
import { FunctionSecretsStateManager, getLocalFunctionSecretNames } from './functionSecretsStateManager';

export const cloneSecretsOnEnvInitHandler = async (context: $TSContext, sourceEnv: string, destEnv: string) => {
  const functionNames = Object.keys((stateManager.getBackendConfig(undefined, { throwIfNotExist: false }) || {})?.[categoryName]);
  const functionsWithSecrets = functionNames.filter(name => !!getLocalFunctionSecretNames(name).length);

  // if there are no functions with secrets, there's nothing to clone
  if (!functionsWithSecrets.length) {
    return;
  }

  const funcSecretsManager = await FunctionSecretsStateManager.getInstance(context);

  const cloneDeltas: Record<ResourceName, SecretDeltas> = {};
  for (const funcName of functionsWithSecrets) {
    cloneDeltas[funcName] = await funcSecretsManager.getEnvCloneDeltas(sourceEnv, funcName);
  }

  const funcSecretDeltas = await cloneEnvWalkthrough(!context?.exeInfo?.inputParams?.yes, cloneDeltas);

  await Promise.all(
    Object.entries(funcSecretDeltas).map(
      async ([funcName, secretDeltas]) => await funcSecretsManager.syncSecretDeltas(secretDeltas, funcName, destEnv),
    ),
  );
};
