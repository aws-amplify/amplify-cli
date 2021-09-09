import { $TSAny, $TSContext, pathManager, stateManager } from 'amplify-cli-core';
import { CloudFormation } from 'aws-sdk';
import { S3 } from '../aws-utils/aws-s3';
import { loadConfiguration } from '../configuration-manager';
import { DeploymentStep } from '../iterative-deployment';
import {
  getDependentFunctions,
  generateIterativeFuncDeploymentSteps,
  prependDeploymentSteps,
  generateTempFuncCFNTemplates,
  uploadTempFuncDeploymentFiles,
} from './utils';

export const prependDeploymentStepsToDisconnectFunctionsFromReplacedModelTables = async (
  context: $TSContext,
  modelsBeingReplaced: string[],
  deploymentSteps: DeploymentStep[],
): Promise<DeploymentStep[]> => {
  const amplifyMeta = stateManager.getMeta();
  const rootStackId = amplifyMeta?.providers?.awscloudformation?.StackId;
  const allFunctionNames = Object.keys(amplifyMeta?.function);
  const functionsDependentOnReplacedModelTables = await getDependentFunctions(
    modelsBeingReplaced,
    allFunctionNames,
    getFunctionParamsSupplier(context),
  );
  // generate deployment steps that will remove references to the replaced tables in the dependent functions
  const { deploymentSteps: disconnectFuncsSteps, lastMetaKey } = await generateIterativeFuncDeploymentSteps(
    new CloudFormation(await loadConfiguration(context)),
    rootStackId,
    functionsDependentOnReplacedModelTables,
  );
  await generateTempFuncCFNTemplates(functionsDependentOnReplacedModelTables);
  await uploadTempFuncDeploymentFiles(await S3.getInstance(context), functionsDependentOnReplacedModelTables);
  return prependDeploymentSteps(disconnectFuncsSteps, deploymentSteps, lastMetaKey);
};

const getFunctionParamsSupplier = (context: $TSContext) => async (functionName: string) => {
  return context.amplify.invokePluginMethod(context, 'function', undefined, 'loadFunctionParameters', [
    pathManager.getResourceDirectoryPath(undefined, 'function', functionName),
  ]) as $TSAny;
};
