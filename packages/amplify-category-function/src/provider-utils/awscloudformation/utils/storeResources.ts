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
import { containerTemplate as containerCfn, buildspec } from './container-resource-template';

const DEFAULT_CONTAINER_PORT = 8080;
export function createContainerResources(context: any, parameters: ContainerParameters) {
  context.amplify.updateamplifyMetaAfterResourceAdd(categoryName, parameters.resourceName, {
    container: true,
    build: true,
    providerPlugin: 'awscloudformation',
    service: 'ElasticContainer',
    dependsOn: [],
  });
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, categoryName, parameters.resourceName);

  fs.ensureDirSync(path.join(resourceDirPath, 'src'));

  const templateParameters = {
    ParamRepositoryName: parameters.resourceName,
    ParamZipPath: '', // TBD after push
    ParamDeploymentBucket: `${context.amplify.getProjectMeta().providers[provider].DeploymentBucketName}`,
    ParamContainerPort: DEFAULT_CONTAINER_PORT,
  };

  fs.writeFileSync(
    path.join(resourceDirPath, 'src', 'Dockerfile'),
    `FROM inanimate/echo-server
  ENV ADD_HEADERS={"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*"}`,
  );
  fs.writeFileSync(path.join(resourceDirPath, 'src', 'buildspec.yml'), buildspec);
  JSONUtilities.writeJson(path.join(resourceDirPath, 'container-template.json'), containerCfn);
  JSONUtilities.writeJson(path.join(resourceDirPath, 'parameters.json'), templateParameters);
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
