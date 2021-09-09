import { $TSAny, $TSContext, JSONUtilities, pathManager, readCFNTemplate, writeCFNTemplate } from 'amplify-cli-core';
import * as path from 'path';
import * as fs from 'fs-extra';
import { S3 } from '../aws-utils/aws-s3';
import { fileLogger } from '../utils/aws-logger';
import { CloudFormation } from 'aws-sdk';
import { getPreviousDeploymentRecord } from '../utils/amplify-resource-state-utils';
import { DeploymentOp, DeploymentStep } from '../iterative-deployment';
import _ from 'lodash';

const logger = fileLogger('disconnect-dependent-resources');

/**
 * Returns the subset of functionNames that have a dependency on a model in modelNames
 */
export const getDependentFunctions = async (
  modelNames: string[],
  functionNames: string[],
  functionParamsSupplier: (functionName: string) => Promise<$TSAny>,
) => {
  const dependentFunctions: string[] = [];
  for (const funcName of functionNames) {
    const funcParams = await functionParamsSupplier(funcName);
    const dependentModels = funcParamsToDependentAppSyncModels(funcParams);
    const hasDep = dependentModels.map(model => modelNames.includes(model)).reduce((acc, it) => acc || it, false);
    if (hasDep) {
      dependentFunctions.push(funcName);
    }
  }
  return dependentFunctions;
};

export const generateTempTemplates = async (dependentFunctions: string[]) => {
  const tempPaths: string[] = [];
  for (const funcName of dependentFunctions) {
    const { cfnTemplate, templateFormat } = await readCFNTemplate(
      path.join(pathManager.getResourceDirectoryPath(undefined, 'function', funcName), `${funcName}-cloudformation-template.json`),
    );
    replaceFnImport(cfnTemplate);
    const tempPath = getTempFuncTemplateLocalPath(funcName);
    await writeCFNTemplate(cfnTemplate, tempPath, { templateFormat });
    tempPaths.push(tempPath);
  }
};

export const uploadTempFuncTemplates = async (s3Client: S3, funcNames: string[]) => {
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
    const log = logger('uploadTemplateToS3.s3.uploadFile', [{ Key: uploads[0].Key }]);
    for (const upload of uploads) {
      try {
        await s3Client.uploadFile(upload, false);
      } catch (error) {
        log(error);
        throw error;
      }
    }
  }
};

export const generateIterativeFuncDeploymentSteps = async (cfnClient: CloudFormation, rootStackId: string, functionNames: string[]) => {
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
  return steps;
};

const generateIterativeFuncDeploymentOp = async (cfnClient: CloudFormation, rootStackId: string, functionName: string) => {
  const funcStack = await cfnClient
    .describeStackResources({ StackName: rootStackId, LogicalResourceId: `function${functionName}` })
    .promise();
  const funcStackId = funcStack.StackResources[0].PhysicalResourceId;
  const { parameters, capabilities } = await getPreviousDeploymentRecord(cfnClient, funcStackId);
  const deploymentStep: DeploymentOp = {
    stackTemplatePathOrUrl: getTempFuncTemplateS3Key(functionName),
    parameters,
    stackName: funcStackId,
    capabilities,
    tableNames: [],
  };

  JSONUtilities.writeJson(getTempFuncMetaLocalPath(functionName), deploymentStep);
  return deploymentStep;
};

export const prependDeploymentSteps = (beforeSteps: DeploymentStep[], afterSteps: DeploymentStep[]) => {
  if (beforeSteps.length === 0) {
    return afterSteps;
  }
  beforeSteps[0].rollback = _.cloneDeep(afterSteps[0].rollback);
  afterSteps[0].rollback = _.cloneDeep(beforeSteps[beforeSteps.length - 1].deployment);
  return beforeSteps.concat(afterSteps);
};

const getTempFuncTemplateS3Key = (funcName: string): string => path.posix.join(s3Prefix, tempTemplateFilename(funcName));
const getTempFuncTemplateLocalPath = (funcName: string): string => path.join(localPrefix(funcName), tempTemplateFilename(funcName));
const getTempFuncMetaLocalPath = (funcName: string): string => path.join(localPrefix(funcName), tempMetaFilename(funcName));
const getTempFuncMetaS3Key = (funcName: string): string => path.posix.join(s3Prefix, tempMetaFilename(funcName));

const tempTemplateFilename = (funcName: string) => `temp-${funcName}-cloudformation-template.json`;
const tempMetaFilename = (funcName: string) => `temp-${funcName}-deployment-meta.json`;
const s3Prefix = 'amplify-cfn-templates/function/temp';
const localPrefix = funcName => path.join(pathManager.getResourceDirectoryPath(undefined, 'function', funcName), 'temp');

export const replaceFnImport = (node: $TSAny) => {
  if (typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    node.forEach(el => replaceFnImport(el));
  }
  const nodeKeys = Object.keys(node);
  if (nodeKeys.length === 1 && nodeKeys[0] === 'Fn::ImportValue') {
    node['Fn::ImportValue'] = undefined;
    node['Fn::Sub'] = 'temporaryPlaceholdervalue';
    return;
  }
  Object.values(node).forEach(value => replaceFnImport(value));
};

export const getFunctionParamsSupplier = (context: $TSContext) => async (functionName: string) => {
  return context.amplify.invokePluginMethod(context, 'function', undefined, 'loadFunctionParameters', [
    pathManager.getResourceDirectoryPath(undefined, 'function', functionName),
  ]) as $TSAny;
};

const funcParamsToDependentAppSyncModels = (funcParams: $TSAny): string[] =>
  Object.keys(funcParams?.permissions?.storage || {})
    .filter(key => key.endsWith(':@model(appsync)'))
    .map(key => key.slice(0, key.lastIndexOf(':')));
