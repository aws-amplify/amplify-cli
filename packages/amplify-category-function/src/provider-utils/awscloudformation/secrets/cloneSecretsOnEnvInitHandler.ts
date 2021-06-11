import { $TSContext } from 'amplify-cli-core';
import _ from 'lodash';
import { cloneEnvWalkthrough } from '../service-walkthroughs/secretValuesWalkthrough';
import { FunctionSecretsStateManager } from './functionSecretsStateManager';

export const cloneSecretsOnEnvInitHandler = async (context: $TSContext, sourceEnv: string, destEnv: string) => {
  const functionDeltaGenerator = async (funcName: string) => {
    const funcSecretsManager = await FunctionSecretsStateManager.getInstance(context);
    return funcSecretsManager.getEnvCloneDeltas(sourceEnv, funcName);
  };
  const funcSecretDeltas = await cloneEnvWalkthrough(true, functionDeltaGenerator);
  if (_.isEmpty(funcSecretDeltas)) {
    return;
  }
  const funcSecretsManager = await FunctionSecretsStateManager.getInstance(context);
  await Promise.all(
    Object.entries(funcSecretDeltas).map(
      async ([funcName, secretDeltas]) => await funcSecretsManager.syncSecretDeltas(secretDeltas, funcName, destEnv),
    ),
  );
};
