import {
  AmplifyFault,
  $TSAny,
  JSONUtilities,
  pathManager,
  readCFNTemplate,
  stateManager,
  writeCFNTemplate,
} from '@aws-amplify/amplify-cli-core';
import * as path from 'path';
import * as fs from 'fs-extra';
import _ from 'lodash';
import { ensureEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import { S3 } from '../aws-utils/aws-s3';
import { fileLogger } from '../utils/aws-logger';
import { getPreviousDeploymentRecord } from '../utils/amplify-resource-state-utils';
import { DeploymentOp, DeploymentStep } from '../iterative-deployment';
import { CloudFormationClient, DescribeStackResourcesCommand } from '@aws-sdk/client-cloudformation';

const logger = fileLogger('disconnect-dependent-resources');

/**
 * Returns the subset of functionNames that have a dependency on a model in modelNames
 */
export const getDependentFunctions = async (
  modelNames: string[],
  functionNames: string[],
  functionParamsSupplier: (functionName: string) => Promise<$TSAny>,
): Promise<string[]> => {
  const dependentFunctions: string[] = [];
  for (const funcName of functionNames) {
    const funcParams = await functionParamsSupplier(funcName);
    const dependentModels = funcParamsToDependentAppSyncModels(funcParams);
    const hasDep = dependentModels.map((model) => modelNames.includes(model)).reduce((acc, it) => acc || it, false);
    if (hasDep) {
      dependentFunctions.push(funcName);
    }
  }
  return dependentFunctions;
};

/**
 * Generates temporary CFN templates for the given functions that have placeholder values for all references to replaced model tables
 */
export const generateTempFuncCFNTemplates = async (dependentFunctions: string[]): Promise<void> => {
  const tempPaths: string[] = [];
  for (const funcName of dependentFunctions) {
    const { cfnTemplate, templateFormat } = readCFNTemplate(
      path.join(pathManager.getResourceDirectoryPath(undefined, 'function', funcName), `${funcName}-cloudformation-template.json`),
    );
    replaceFnImport(cfnTemplate);
    const tempPath = getTempFuncTemplateLocalPath(funcName);
    await writeCFNTemplate(cfnTemplate, tempPath, { templateFormat });
    tempPaths.push(tempPath);
  }
};

/**
 * Uploads the CFN template and iterative deployment meta file to S3
 */
export const uploadTempFuncDeploymentFiles = async (s3Client: S3, funcNames: string[]): Promise<void> => {
  for (const funcName of funcNames) {
    const uploads = [
      {
        Body: fs.createReadStream(getTempFuncTemplateLocalPath(funcName)),
        Key: getTempFuncTemplateS3Key(funcName),
      },
      {
        Body: fs.createReadStream(getTempFuncMetaLocalPath(funcName)),
        Key: getTempFuncMetaS3Key(funcName),
      },
    ];
    logger('uploadTemplateToS3.s3.uploadFile', [{ Key: uploads[0].Key }])();
    for (const upload of uploads) {
      await s3Client.uploadFile(upload, false);
    }
  }
};

/**
 * Generates the iterative deployment steps necessary to remove then re-add function dependency on rebuilt table
 */
export const generateIterativeFuncDeploymentSteps = async (
  cfnClient: CloudFormationClient,
  rootStackId: string,
  functionNames: string[],
): Promise<{ deploymentSteps: DeploymentStep[]; lastMetaKey: string }> => {
  let rollback: DeploymentOp;
  let previousMetaKey: string;
  const steps: DeploymentStep[] = [];
  for (const funcName of functionNames) {
    const deploymentOp = await generateIterativeFuncDeploymentOp(cfnClient, rootStackId, funcName);
    deploymentOp.previousMetaKey = previousMetaKey;
    steps.push({
      deployment: deploymentOp,
      rollback,
    });
    rollback = deploymentOp;
    previousMetaKey = getTempFuncMetaS3Key(funcName);
  }
  return { deploymentSteps: steps, lastMetaKey: previousMetaKey };
};

/**
 * Prepends beforeSteps and afterSteps into a single array of deployment steps.
 * Moves rollback and previousMetaKey pointers to maintain the integrity of the deployment steps.
 */
export const prependDeploymentSteps = (
  beforeSteps: DeploymentStep[],
  afterSteps: DeploymentStep[],
  beforeStepsLastMetaKey: string,
): DeploymentStep[] => {
  if (beforeSteps.length === 0) {
    return afterSteps;
  }
  /* eslint-disable no-param-reassign */
  beforeSteps[0].rollback = _.cloneDeep(afterSteps[0].rollback);
  beforeSteps[0].deployment.previousMetaKey = afterSteps[0].deployment.previousMetaKey;
  afterSteps[0].rollback = _.cloneDeep(beforeSteps[beforeSteps.length - 1].deployment);
  afterSteps[0].deployment.previousMetaKey = beforeStepsLastMetaKey;
  if (afterSteps.length > 1) {
    afterSteps[1].rollback.previousMetaKey = beforeStepsLastMetaKey;
  }
  return beforeSteps.concat(afterSteps);
  /* eslint-enable no-param-reassign */
};

/**
 * Generates a deployment operation for a temporary function deployment.
 * Also writes the deployment operation to the temp meta path
 */
const generateIterativeFuncDeploymentOp = async (
  cfnClient: CloudFormationClient,
  rootStackId: string,
  functionName: string,
): Promise<DeploymentOp> => {
  const funcStack = await cfnClient.send(
    new DescribeStackResourcesCommand({ StackName: rootStackId, LogicalResourceId: `function${functionName}` }),
  );

  if (!funcStack.StackResources || funcStack.StackResources.length === 0) {
    throw new AmplifyFault('ResourceNotFoundFault', {
      message: `Could not find function ${functionName} in root stack ${rootStackId}`,
    });
  }

  const funcStackId = funcStack.StackResources[0].PhysicalResourceId;
  const { parameters, capabilities } = await getPreviousDeploymentRecord(cfnClient, funcStackId);
  const funcCfnParams = stateManager.getResourceParametersJson(undefined, 'function', functionName, {
    throwIfNotExist: false,
    default: {},
  });
  const funcEnvParams = (await ensureEnvParamManager()).instance.getResourceParamManager('function', functionName).getAllParams();
  const params = { ...parameters, ...funcCfnParams, ...funcEnvParams };
  const deploymentStep: DeploymentOp = {
    stackTemplatePathOrUrl: getTempFuncTemplateS3Key(functionName),
    parameters: params,
    stackName: funcStackId,
    capabilities,
    tableNames: [],
  };

  JSONUtilities.writeJson(getTempFuncMetaLocalPath(functionName), deploymentStep);
  return deploymentStep;
};

// helper functions for constructing local paths and S3 keys for function templates and deployment meta files
const getTempFuncTemplateS3Key = (funcName: string): string => path.posix.join(s3Prefix, tempTemplateFilename(funcName));
const getTempFuncTemplateLocalPath = (funcName: string): string => path.join(localPrefix(funcName), tempTemplateFilename(funcName));
const getTempFuncMetaLocalPath = (funcName: string): string => path.join(localPrefix(funcName), tempMetaFilename(funcName));
const getTempFuncMetaS3Key = (funcName: string): string => path.posix.join(s3Prefix, tempMetaFilename(funcName));

const tempTemplateFilename = (funcName: string): string => `temp-${funcName}-cloudformation-template.json`;
const tempMetaFilename = (funcName: string): string => `temp-${funcName}-deployment-meta.json`;

export const s3Prefix = 'amplify-cfn-templates/function/temp';

/**
 * Path prefix for function temp files
 */
export const localPrefix = (funcName: string): string =>
  path.join(pathManager.getResourceDirectoryPath(undefined, 'function', funcName), 'temp');

/**
 * Recursively searches for 'Fn::ImportValue' nodes in a CFN template object and replaces them with a placeholder value
 */
const replaceFnImport = (node: $TSAny): void => {
  if (typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((el) => replaceFnImport(el));
  }
  const nodeKeys = Object.keys(node);
  if (nodeKeys.length === 1 && nodeKeys[0] === 'Fn::ImportValue') {
    /* eslint-disable no-param-reassign */
    node['Fn::ImportValue'] = undefined;
    node['Fn::Sub'] = 'TemporaryPlaceholderValue';
    /* eslint-enable no-param-reassign */
    return;
  }
  Object.values(node).forEach((value) => replaceFnImport(value));
};

/**
 * Given the contents of the function-parameters.json file for a function, returns the list of AppSync models this function depends on.
 */
const funcParamsToDependentAppSyncModels = (funcParams: $TSAny): string[] =>
  Object.keys(funcParams?.permissions?.storage || {})
    .filter((key) => key.endsWith(':@model(appsync)'))
    .map((key) => key.slice(0, key.lastIndexOf(':')));
