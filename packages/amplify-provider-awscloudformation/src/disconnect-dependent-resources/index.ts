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
  s3Prefix,
  localPrefix,
} from './utils';
import * as fs from 'fs-extra';

let functionsDependentOnReplacedModelTables: string[] = [];

/**
 * Identifies if any functions depend on a model table that is being replaced.
 * If so, it creates temporary CFN templates for these functions that do not reference the replaced table and adds deployment steps to the array to update the functions before the table is replaced
 * @param context Amplify context
 * @param modelsBeingReplaced Names of the models being replaced during this push operation
 * @param deploymentSteps The existing list of deployment steps that will be prepended to in the case of dependent functions
 * @returns The new list of deploymentSteps
 */
export const prependDeploymentStepsToDisconnectFunctionsFromReplacedModelTables = async (
  context: $TSContext,
  modelsBeingReplaced: string[],
  deploymentSteps: DeploymentStep[],
): Promise<DeploymentStep[]> => {
  const amplifyMeta = stateManager.getMeta();
  const rootStackId = amplifyMeta?.providers?.awscloudformation?.StackId;
  const allFunctionNames = Object.keys(amplifyMeta?.function || {});
  functionsDependentOnReplacedModelTables = await getDependentFunctions(
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

export const postDeploymentCleanup = async (s3Client: S3, deploymentBucketName: string) => {
  if (functionsDependentOnReplacedModelTables.length < 1) {
    return;
  }
  await s3Client.deleteDirectory(deploymentBucketName, s3Prefix);
  await Promise.all(functionsDependentOnReplacedModelTables.map(funcName => fs.remove(localPrefix(funcName))));
};

// helper function to load the function-parameters.json file given a functionName
const getFunctionParamsSupplier = (context: $TSContext) => async (functionName: string) => {
  return context.amplify.invokePluginMethod(context, 'function', undefined, 'loadFunctionParameters', [
    pathManager.getResourceDirectoryPath(undefined, 'function', functionName),
  ]) as $TSAny;
};
