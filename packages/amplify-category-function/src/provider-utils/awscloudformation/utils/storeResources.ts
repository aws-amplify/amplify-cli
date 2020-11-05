import { JSONUtilities } from 'amplify-cli-core';
import { FunctionParameters, FunctionTriggerParameters, FunctionBreadcrumbs, ContainerParameters } from 'amplify-function-plugin-interface';
import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import { functionParametersFileName, layerParametersFileName, parametersFileName, provider, ServiceName } from './constants';
import { category as categoryName } from '../../../constants';
import { generateLayerCfnObj } from './lambda-layer-cloudformation-template';
import { isMultiEnvLayer, LayerParameters, StoredLayerParameters } from './layerParams';
import { convertLambdaLayerMetaToLayerCFNArray } from './layerArnConverter';
import { saveLayerRuntimes } from './layerRuntimes';
import { containerFiles } from './container-resource-template';
import { getNewCFNParameters } from './cloudformationHelpers';
import { ContainerStack } from './container-stack';
import { prepareApp } from "@aws-cdk/core/lib/private/prepare-app";

const DEFAULT_CONTAINER_PORT = 8080;
export function createContainerResources(context: any, parameters: ContainerParameters): {resourceDirPath: string}  {
  
  context.amplify.updateamplifyMetaAfterResourceAdd(categoryName, parameters.resourceName, {
    container: true,
    build: true,
    providerPlugin: 'awscloudformation',
    service: 'ElasticContainer',
    dependsOn: parameters.dependsOn,
    githubPath: parameters.githubPath,
    scheduleOptions: parameters.scheduleOptions,
    deploymentMechanism: parameters.deploymentMechanism,
    mutableParametersState: parameters.mutableParametersState,
  });
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, categoryName, parameters.resourceName);

  fs.ensureDirSync(path.join(resourceDirPath, 'src'));
  
  Object.entries(containerFiles).forEach(([fileName, fileContents]) => {
    fs.writeFileSync(path.join(resourceDirPath, 'src', fileName), fileContents);
  });  

  const deploymentBucket = `${context.amplify.getProjectMeta().providers[provider].DeploymentBucketName}`;
  
  const stack = new ContainerStack(undefined, "Container", {
    deploymentBucket,
    containerPort: DEFAULT_CONTAINER_PORT,
    awaiterZipPath: '',
  });

  // TODO: Move these lines to a function for reuse
  prepareApp(stack);
  const containerCfn = (stack as any)._toCloudFormation();

  Object.keys(containerCfn.Parameters).forEach(k => {
    if(k.startsWith('AssetParameters')) {
      let value = '';
      
      if(k.includes('Bucket')) {
        value = deploymentBucket;
      } else if (k.includes('VersionKey')) {
        value = 'custom-resource-pipeline-awaiter.zip||';
      }

      containerCfn.Parameters[k].Default = value;
    }
  });

  if (!containerCfn.Resources['AmplifyResourcesPolicy']) {
    containerCfn.Resources['AmplifyResourcesPolicy'] = {
      DependsOn: ['MyTaskExecutionRoleD2FEFCB2'], // Hardcoded on the template
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'amplify-container-execution-policy',
        Roles: [
          {
            Ref: 'MyTaskExecutionRoleD2FEFCB2', // Hardcoded on the template
          },
        ],
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [],
        },
      },
    };
  }

  if (!parameters.categoryPolicies || parameters.categoryPolicies.length === 0) {
    delete containerCfn.Resources['AmplifyResourcesPolicy'];
  } else {
    containerCfn.Resources['AmplifyResourcesPolicy'].Properties.PolicyDocument.Statement = parameters.categoryPolicies;
  }

  if (parameters.environmentMap && Object.keys(parameters.environmentMap).length > 0) {
    const mapArray: Array<{Name: string, Value: string}> = [];
    Object.keys(parameters.environmentMap).forEach(key => {
      mapArray.push({
        Name: key,
        Value: parameters.environmentMap[key]
      });
    });

    containerCfn.Resources.MyTaskF5748B4B.Properties.ContainerDefinitions[0]['Environment'] = mapArray;
  }

  const dependsOnParams = { env: { Type: 'String' } };

  Object.keys(parameters.environmentMap)
      .filter(key => key !== 'ENV')
      .filter(key => key !== 'REGION')
      .filter(resourceProperty => 'Ref' in parameters.environmentMap[resourceProperty])
      .forEach(resourceProperty => {
        dependsOnParams[parameters.environmentMap[resourceProperty].Ref] = {
          Type: 'String',
          Default: parameters.environmentMap[resourceProperty].Ref,
        };
      });

  containerCfn.Parameters = getNewCFNParameters(
    containerCfn.Parameters, 
    {}, 
    dependsOnParams,
    {}
    );

  const cfnFileName = `${parameters.resourceName}-cloudformation-template.json`;
  JSONUtilities.writeJson(path.join(resourceDirPath, cfnFileName), containerCfn);

  return { resourceDirPath }
}

// handling both FunctionParameters and FunctionTriggerParameters here is a hack
// ideally we refactor the auth trigger flows to use FunctionParameters directly and get rid of FunctionTriggerParameters altogether
export function createFunctionResources(context: any, parameters: FunctionParameters | FunctionTriggerParameters) {
  context.print.info('before update meta');
  context.amplify.updateamplifyMetaAfterResourceAdd(
    categoryName,
    parameters.resourceName || parameters.functionName,
    translateFuncParamsToResourceOpts(parameters),
  );

  context.print.info('after update meta');
  // copy template, CFN and parameter files
  copyTemplateFiles(context, parameters);
  context.print.info('after copy template meta');
  saveMutableState(context, parameters);
  context.print.info('after save mutable state');
  saveCFNParameters(context, parameters);
  context.print.info('after save CFN parameters');
  context.amplify.leaveBreadcrumbs(context, categoryName, parameters.resourceName, createBreadcrumbs(parameters));
  context.print.info('after leave breadcrumbs');
}

export const createLayerArtifacts = (context, parameters: LayerParameters, latestVersion: number = 1): string => {
  const layerDirPath = ensureLayerFolders(context, parameters);
  updateLayerState(context, parameters, layerDirPath);
  createParametersFile(context, { layerVersion: latestVersion }, parameters.layerName, parametersFileName);
  createLayerCfnFile(context, parameters, layerDirPath);
  addLayerToAmplifyMeta(context, parameters);
  return layerDirPath;
};

// updates the layer resources and returns the resource directory
const defaultOpts = {
  layerParams: true,
  cfnFile: true,
  amplifyMeta: true,
};
export const updateLayerArtifacts = (
  context,
  parameters: LayerParameters,
  latestVersion?: number,
  options: Partial<typeof defaultOpts> = {},
): string => {
  options = _.assign(defaultOpts, options);
  const layerDirPath = ensureLayerFolders(context, parameters);
  if (options.layerParams) {
    updateLayerState(context, parameters, layerDirPath);
  }
  if (options.cfnFile) {
    if (latestVersion !== undefined) {
      createParametersFile(context, { layerVersion: latestVersion }, parameters.layerName, parametersFileName);
    }
    updateLayerCfnFile(context, parameters, layerDirPath);
  }
  if (options.amplifyMeta) {
    updateLayerInAmplifyMeta(context, parameters);
  }
  return layerDirPath;
};

export function removeLayerArtifacts(context, layerName) {
  if (isMultiEnvLayer(context, layerName)) {
    removeLayerFromTeamProviderInfo(context, layerName);
  }
}

// ideally function update should be refactored so this function does not need to be exported
export function saveMutableState(
  context,
  parameters:
    | Partial<Pick<FunctionParameters, 'mutableParametersState' | 'resourceName' | 'lambdaLayers' | 'functionName'>>
    | FunctionTriggerParameters,
) {
  createParametersFile(
    context,
    buildParametersFileObj(parameters),
    parameters.resourceName || parameters.functionName,
    functionParametersFileName,
  );
}

// ideally function update should be refactored so this function does not need to be exported
export function saveCFNParameters(
  context,
  parameters: Partial<Pick<FunctionParameters, 'cloudwatchRule' | 'resourceName'>> | FunctionTriggerParameters,
) {
  if ('trigger' in parameters) {
    const params = {
      modules: parameters.modules.join(),
      resourceName: parameters.resourceName,
    };
    createParametersFile(context, params, parameters.resourceName, parametersFileName);
  }
  if ('cloudwatchRule' in parameters) {
    const params = {
      CloudWatchRule: parameters.cloudwatchRule,
    };
    createParametersFile(context, params, parameters.resourceName, parametersFileName);
  }
}

function updateLayerState(context: any, parameters: LayerParameters, layerDirPath: string) {
  if (isMultiEnvLayer(context, parameters.layerName)) {
    updateLayerTeamProviderInfo(context, parameters, layerDirPath);
    saveLayerRuntimes(layerDirPath, parameters.layerName, parameters.runtimes);
  } else {
    createLayerParametersFile(context, parameters, layerDirPath, isMultiEnvLayer(context, parameters.layerName));
  }
}

function copyTemplateFiles(context: any, parameters: FunctionParameters | FunctionTriggerParameters) {
  // copy function template files
  const destDir = context.amplify.pathManager.getBackendDirPath();
  const copyJobs = parameters.functionTemplate.sourceFiles.map(file => {
    return {
      dir: parameters.functionTemplate.sourceRoot,
      template: file,
      target: path.join(
        destDir,
        categoryName,
        parameters.resourceName,
        _.get(parameters.functionTemplate.destMap, file, file.replace(/\.ejs$/, '')),
      ),
    };
  });

  // this is a hack to reuse some old code
  let templateParams: any = parameters;
  if ('trigger' in parameters) {
    let triggerEnvs = context.amplify.loadEnvResourceParameters(context, 'function', parameters.resourceName);
    parameters.triggerEnvs = JSON.parse(parameters.triggerEnvs) || [];

    parameters.triggerEnvs.forEach(c => {
      triggerEnvs[c.key] = c.value;
    });
    templateParams = _.assign(templateParams, triggerEnvs);
  }
  templateParams = _.assign(templateParams, {
    enableCors: process.env.AMPLIFY_CLI_LAMBDA_CORS_HEADER === 'true',
  });

  context.amplify.copyBatch(context, copyJobs, templateParams, false);

  // copy cloud resource template
  const cloudTemplateJob = {
    dir: '',
    template: parameters.cloudResourceTemplatePath,
    target: path.join(destDir, categoryName, parameters.resourceName, `${parameters.resourceName}-cloudformation-template.json`),
  };

  const copyJobParams: any = parameters;
  if ('lambdaLayers' in parameters) {
    const layerCFNValues = convertLambdaLayerMetaToLayerCFNArray(context, parameters.lambdaLayers, context.amplify.getEnvInfo().envName);
    copyJobParams.lambdaLayersCFNArray = layerCFNValues;
  }
  context.amplify.copyBatch(context, [cloudTemplateJob], copyJobParams, false);
}

function ensureLayerFolders(context, parameters) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const layerDirPath = path.join(projectBackendDirPath, categoryName, parameters.layerName);
  fs.ensureDirSync(path.join(layerDirPath, 'opt'));
  parameters.runtimes.forEach(runtime => ensureLayerRuntimeFolder(layerDirPath, runtime));
  return layerDirPath;
}

// Default files are only created if the path does not exist
function ensureLayerRuntimeFolder(layerDirPath: string, runtime) {
  const runtimeDirPath = path.join(layerDirPath, 'lib', runtime.layerExecutablePath);
  if (!fs.pathExistsSync(runtimeDirPath)) {
    fs.ensureDirSync(runtimeDirPath);
    fs.writeFileSync(path.join(runtimeDirPath, 'README.txt'), 'Replace this file with your layer files');
    (runtime.layerDefaultFiles || []).forEach(defaultFile =>
      fs.writeFileSync(path.join(layerDirPath, 'lib', defaultFile.path, defaultFile.filename), defaultFile.content),
    );
  }
}

function createLayerCfnFile(context, parameters: LayerParameters, layerDirPath: string) {
  JSONUtilities.writeJson(
    path.join(layerDirPath, parameters.layerName + '-awscloudformation-template.json'),
    generateLayerCfnObj(context, parameters),
  );
}

function updateLayerCfnFile(context, parameters: LayerParameters, layerDirPath: string) {
  JSONUtilities.writeJson(
    path.join(layerDirPath, parameters.layerName + '-awscloudformation-template.json'),
    generateLayerCfnObj(context, parameters),
  );
}

const writeParametersToAmplifyMeta = (context, layerName: string, parameters) => {
  const amplifyMeta = context.amplify.getProjectMeta();
  _.set(amplifyMeta, ['function', layerName], parameters);
  JSONUtilities.writeJson(context.amplify.pathManager.getAmplifyMetaFilePath(), amplifyMeta);
};

const addLayerToAmplifyMeta = (context, parameters: LayerParameters) => {
  context.amplify.updateamplifyMetaAfterResourceAdd(categoryName, parameters.layerName, amplifyMetaAndBackendParams(parameters));
  writeParametersToAmplifyMeta(
    context,
    parameters.layerName,
    layerParamsToAmplifyMetaParams(parameters, isMultiEnvLayer(context, parameters.layerName)),
  );
};

const updateLayerInAmplifyMeta = (context, parameters: LayerParameters) => {
  writeParametersToAmplifyMeta(
    context,
    parameters.layerName,
    layerParamsToAmplifyMetaParams(parameters, isMultiEnvLayer(context, parameters.layerName)),
  );
};

const createLayerParametersFile = (
  context,
  parameters: LayerParameters | StoredLayerParameters,
  layerDirPath: string,
  isMultiEnv: boolean,
) => {
  fs.ensureDirSync(layerDirPath);
  const parametersFilePath = path.join(layerDirPath, layerParametersFileName);
  JSONUtilities.writeJson(parametersFilePath, layerParamsToStoredParams(parameters, isMultiEnv));
};

const updateLayerTeamProviderInfo = (context, parameters: LayerParameters, layerDirPath: string) => {
  fs.ensureDirSync(layerDirPath);
  const teamProviderInfoPath = context.amplify.pathManager.getProviderInfoFilePath();
  const { envName } = context.amplify.getEnvInfo();
  if (!fs.existsSync(teamProviderInfoPath)) {
    throw new Error(`${teamProviderInfoPath} not found.`);
  }

  const teamProviderInfo = context.amplify.readJsonFile(teamProviderInfoPath);
  _.set(
    teamProviderInfo,
    [envName, 'nonCFNdata', categoryName, parameters.layerName],
    layerParamsToStoredParams(parameters, isMultiEnvLayer(context, parameters.layerName)),
  );
  JSONUtilities.writeJson(teamProviderInfoPath, teamProviderInfo);
};

const removeLayerFromTeamProviderInfo = (context, layerName) => {
  const teamProviderInfoPath = context.amplify.pathManager.getProviderInfoFilePath();
  const { envName } = context.amplify.getEnvInfo();
  if (!fs.existsSync(teamProviderInfoPath)) {
    throw new Error(`${teamProviderInfoPath} not found.`);
  }
  const teamProviderInfo = JSONUtilities.readJson(teamProviderInfoPath);
  _.unset(teamProviderInfo, [envName, 'nonCFNdata', categoryName, layerName]);
  if (_.isEmpty(_.get(teamProviderInfo, [envName, 'nonCFNdata', categoryName]))) {
    _.unset(teamProviderInfo, [envName, 'nonCFNdata', categoryName]);
    if (_.isEmpty(_.get(teamProviderInfo, [envName, 'nonCFNdata']))) {
      _.unset(teamProviderInfo, [envName, 'nonCFNdata']);
    }
  }
  JSONUtilities.writeJson(teamProviderInfoPath, teamProviderInfo);
};

interface LayerMetaAndBackendConfigParams {
  providerPlugin: string;
  service: string;
  build: boolean;
}

const amplifyMetaAndBackendParams = (parameters: LayerParameters): LayerMetaAndBackendConfigParams => ({
  providerPlugin: parameters.providerContext.provider,
  service: parameters.providerContext.service,
  build: parameters.build,
});

const layerParamsToAmplifyMetaParams = (
  parameters: LayerParameters,
  isMultiEnv: boolean,
): LayerMetaAndBackendConfigParams & StoredLayerParameters => {
  const amplifyMetaBackendParams = amplifyMetaAndBackendParams(parameters);
  return _.assign(layerParamsToStoredParams(parameters, isMultiEnv), amplifyMetaBackendParams);
};

const layerParamsToStoredParams = (parameters: LayerParameters | StoredLayerParameters, isMultiEnv: boolean): StoredLayerParameters => {
  const storedParams: StoredLayerParameters = { layerVersionMap: parameters.layerVersionMap };
  if (!isMultiEnv) {
    storedParams.runtimes = (parameters.runtimes || []).map(runtime =>
      _.pick(runtime, 'value', 'name', 'layerExecutablePath', 'cloudTemplateValue'),
    );
  }
  return storedParams;
};

function createParametersFile(context, parameters, resourceName, parametersFileName) {
  const parametersFilePath = path.join(context.amplify.pathManager.getBackendDirPath(), categoryName, resourceName, parametersFileName);
  const currentParameters = JSONUtilities.readJson(parametersFilePath, { throwIfNotExist: false }) || ({} as any);
  delete currentParameters.mutableParametersState; // this field was written in error in a previous version of the cli
  JSONUtilities.writeJson(parametersFilePath, { ...currentParameters, ...parameters });
}

function buildParametersFileObj(
  parameters: Partial<Pick<FunctionParameters, 'mutableParametersState' | 'lambdaLayers'>> | FunctionTriggerParameters,
): any {
  if ('trigger' in parameters) {
    return _.omit(parameters, ['functionTemplate', 'cloudResourceTemplatePath']);
  }
  return { ...parameters.mutableParametersState, ..._.pick(parameters, ['lambdaLayers']) };
}

function translateFuncParamsToResourceOpts(params: FunctionParameters | FunctionTriggerParameters): any {
  let result: any = {
    build: true,
    providerPlugin: provider,
    service: ServiceName.LambdaFunction,
  };
  if (!('trigger' in params)) {
    result.dependsOn = params.dependsOn;
  }
  return result;
}

function createBreadcrumbs(params: FunctionParameters | FunctionTriggerParameters): FunctionBreadcrumbs {
  if ('trigger' in params) {
    return {
      pluginId: 'amplify-nodejs-function-runtime-provider',
      functionRuntime: 'nodejs',
      useLegacyBuild: true,
      defaultEditorFile: 'src/index.js',
    };
  }
  return {
    pluginId: params.runtimePluginId,
    functionRuntime: params.runtime.value,
    useLegacyBuild: params.runtime.value === 'nodejs' ? true : false, // so we can update node builds in the future
    defaultEditorFile: params.functionTemplate.defaultEditorFile,
  };
}
