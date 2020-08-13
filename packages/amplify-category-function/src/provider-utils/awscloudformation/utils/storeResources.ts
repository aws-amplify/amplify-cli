import { FunctionParameters, FunctionTriggerParameters, FunctionBreadcrumbs } from 'amplify-function-plugin-interface';
import { FeatureFlags } from 'amplify-cli-core';
import path from 'path';
import fs from 'fs-extra';
import { functionParametersFileName, layerParametersFileName, parametersFileName, provider, ServiceName } from './constants';
import { category as categoryName } from '../../../constants';
import { generateLayerCfnObj } from './lambda-layer-cloudformation-template';
import { LayerParameters, StoredLayerParameters } from './layerParams';
import _ from 'lodash';
import { convertLambdaLayerMetaToLayerCFNArray } from './layerArnConverter';

// handling both FunctionParameters and FunctionTriggerParameters here is a hack
// ideally we refactor the auth trigger flows to use FunctionParameters directly and get rid of FunctionTriggerParameters altogether
export function createFunctionResources(context: any, parameters: FunctionParameters | FunctionTriggerParameters) {
  context.amplify.updateamplifyMetaAfterResourceAdd(
    categoryName,
    parameters.resourceName || parameters.functionName,
    translateFuncParamsToResourceOpts(parameters),
  );

  // copy template, CFN and parameter files
  copyTemplateFiles(context, parameters);
  saveMutableState(context, parameters);
  saveCFNParameters(context, parameters);
  context.amplify.leaveBreadcrumbs(context, categoryName, parameters.resourceName, createBreadcrumbs(parameters));
}

export const createLayerArtifacts = (context, parameters: LayerParameters, latestVersion: number = 1): string => {
  const layerDirPath = ensureLayerFolders(context, parameters);
  if (FeatureFlags.getBoolean('lambdaLayers.multiEnv')) {
    updateLayerTeamProviderInfo(context, parameters, layerDirPath);
  } else {
    createLayerParametersFile(context, parameters, layerDirPath);
  }
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
    if (FeatureFlags.getBoolean('lambdaLayers.multiEnv')) {
      updateLayerTeamProviderInfo(context, parameters, layerDirPath);
    } else {
      createLayerParametersFile(context, parameters, layerDirPath);
    }
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
  if (FeatureFlags.getBoolean('lambdaLayers.multiEnv')) {
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

  context.amplify.copyBatch(context, copyJobs, templateParams, false);

  // copy cloud resource template
  const cloudTemplateJob = {
    dir: '',
    template: parameters.cloudResourceTemplatePath,
    target: path.join(destDir, categoryName, parameters.resourceName, `${parameters.resourceName}-cloudformation-template.json`),
  };

  const copyJobParams: any = parameters;
  if ('lambdaLayers' in parameters) {
    const layerCFNValues = convertLambdaLayerMetaToLayerCFNArray(parameters.lambdaLayers, context.amplify.getEnvInfo().envName);
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
  context.amplify.writeObjectAsJson(
    path.join(layerDirPath, parameters.layerName + '-awscloudformation-template.json'),
    generateLayerCfnObj(context, parameters),
    true,
  );
}

function updateLayerCfnFile(context, parameters: LayerParameters, layerDirPath: string) {
  context.amplify.writeObjectAsJson(
    path.join(layerDirPath, parameters.layerName + '-awscloudformation-template.json'),
    generateLayerCfnObj(context, parameters),
    true,
  );
}

const addLayerToAmplifyMeta = (context, parameters: LayerParameters) =>
  context.amplify.updateamplifyMetaAfterResourceAdd(categoryName, parameters.layerName, layerParamsToAmplifyMetaParams(parameters));

const updateLayerInAmplifyMeta = (context, parameters: LayerParameters) => {
  const metaParams = layerParamsToAmplifyMetaParams(parameters);
  context.amplify.updateamplifyMetaAfterResourceUpdate(categoryName, parameters.layerName, 'runtimes', metaParams.runtimes);
  context.amplify.updateamplifyMetaAfterResourceUpdate(categoryName, parameters.layerName, 'layerVersionMap', metaParams.layerVersionMap);
  context.amplify.updateamplifyMetaAfterResourceUpdate(categoryName, parameters.layerName, 'build', metaParams.build);
};

const createLayerParametersFile = (context, parameters: LayerParameters | StoredLayerParameters, layerDirPath: string) => {
  fs.ensureDirSync(layerDirPath);
  const parametersFilePath = path.join(layerDirPath, layerParametersFileName);
  context.amplify.writeObjectAsJson(parametersFilePath, layerParamsToStoredParams(parameters), true);
};

const updateLayerTeamProviderInfo = (context, parameters: LayerParameters, layerDirPath: string) => {
  fs.ensureDirSync(layerDirPath);
  const teamProviderInfoPath = context.amplify.pathManager.getProviderInfoFilePath();
  const { envName } = context.amplify.getEnvInfo();
  if (!fs.existsSync(teamProviderInfoPath)) {
    throw new Error(`${teamProviderInfoPath} not found.`);
  }

  const teamProviderInfo = context.amplify.readJsonFile(teamProviderInfoPath);
  _.set(teamProviderInfo, [envName, 'nonCFNdata', categoryName, parameters.layerName], layerParamsToStoredParams(parameters));
  context.amplify.writeObjectAsJson(teamProviderInfoPath, teamProviderInfo, true);
};

const removeLayerFromTeamProviderInfo = (context, layerName) => {
  const teamProviderInfoPath = context.amplify.pathManager.getProviderInfoFilePath();
  const { envName } = context.amplify.getEnvInfo();
  if (!fs.existsSync(teamProviderInfoPath)) {
    throw new Error(`${teamProviderInfoPath} not found.`);
  }
  const teamProviderInfo = context.amplify.readJsonFile(teamProviderInfoPath);
  _.unset(teamProviderInfo, [envName, 'nonCFNdata', categoryName, layerName]);
  if (_.isEqual(_.get(teamProviderInfo, [envName, 'nonCFNdata', categoryName]), {})) {
    _.unset(teamProviderInfo, [envName, 'nonCFNdata', categoryName]);
    if (_.isEqual(_.get(teamProviderInfo, [envName, 'nonCFNdata']), {})) {
      _.unset(teamProviderInfo, [envName, 'nonCFNdata']);
    }
  }
  context.amplify.writeObjectAsJson(teamProviderInfoPath, teamProviderInfo, true);
};

const layerParamsToAmplifyMetaParams = (
  parameters: LayerParameters,
): StoredLayerParameters & { providerPlugin: string; service: string; build: boolean } => {
  return _.assign(layerParamsToStoredParams(parameters), {
    providerPlugin: parameters.providerContext.provider,
    service: parameters.providerContext.service,
    build: parameters.build,
  });
};

const layerParamsToStoredParams = (parameters: LayerParameters | StoredLayerParameters): StoredLayerParameters => ({
  runtimes: (parameters.runtimes || []).map(runtime => _.pick(runtime, 'value', 'name', 'layerExecutablePath', 'cloudTemplateValue')),
  layerVersionMap: parameters.layerVersionMap,
});

function createParametersFile(context, parameters, resourceName, parametersFileName) {
  const parametersFilePath = path.join(context.amplify.pathManager.getBackendDirPath(), categoryName, resourceName, parametersFileName);
  const currentParameters = context.amplify.readJsonFile(parametersFilePath, undefined, false) || {};
  delete currentParameters.mutableParametersState; // this field was written in error in a previous version of the cli
  context.amplify.writeObjectAsJson(parametersFilePath, { ...currentParameters, ...parameters }, true);
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
