import { $TSAny, $TSContext, $TSObject, JSONUtilities, pathManager, stateManager } from 'amplify-cli-core';
import { FunctionBreadcrumbs, FunctionParameters, FunctionTriggerParameters } from 'amplify-function-plugin-interface';
import fs from 'fs-extra';
import _ from 'lodash';
import path from 'path';
import { category as categoryName } from '../../../constants';
import { functionParametersFileName, parametersFileName, provider, ServiceName } from './constants';
import { generateLayerCfnObj } from './lambda-layer-cloudformation-template';
import { convertLambdaLayerMetaToLayerCFNArray } from './layerArnConverter';

// handling both FunctionParameters and FunctionTriggerParameters here is a hack
// ideally we refactor the auth trigger flows to use FunctionParameters directly and get rid of FunctionTriggerParameters altogether
export function createFunctionResources(context: $TSContext, parameters: FunctionParameters | FunctionTriggerParameters) {
  context.amplify.updateamplifyMetaAfterResourceAdd(
    categoryName,
    parameters.resourceName || parameters.functionName,
    translateFuncParamsToResourceOpts(parameters),
  );

  // copy template, CFN and parameter files
  copyTemplateFiles(context, parameters);
  saveMutableState(parameters);
  saveCFNParameters(parameters);
  context.amplify.leaveBreadcrumbs(categoryName, parameters.resourceName, createBreadcrumbs(parameters));
}

export const createLayerArtifacts = (context: $TSContext, parameters: LayerParameters): string => {
  const layerDirPath = ensureLayerFolders(parameters);
  // updateLayerState(context, parameters, layerDirPath);
  createParametersFile({ layerVersion: latestVersion }, parameters.layerName, parametersFileName);
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
export const updateLayerArtifacts = async (
  context: $TSContext,
  parameters: LayerParameters,
  options: Partial<typeof defaultOpts> = {},
): Promise<void> => {
  options = _.assign(defaultOpts, options);
  const layerDirPath = ensureLayerFolders(parameters);

  const provider = context.amplify.getProviderPlugins(context).awscloudformation; // TODO, make provider agnostic

  if (options.layerParams) {
    // updateLayerState(context, parameters, layerDirPath);
  }
  if (options.cfnFile) {
    updateLayerCfnFile(context, parameters, layerDirPath);
  }
  if (options.amplifyMeta) {
    updateLayerInAmplifyMeta(parameters);
  }
};

export function removeLayerArtifacts(context: $TSContext, layerName: string) {
  if (isMultiEnvLayer(layerName)) {
    removeLayerFromTeamProviderInfo(context, layerName);
  }
}

// ideally function update should be refactored so this function does not need to be exported
export function saveMutableState(
  parameters:
    | Partial<Pick<FunctionParameters, 'mutableParametersState' | 'resourceName' | 'lambdaLayers' | 'functionName'>>
    | FunctionTriggerParameters,
) {
  createParametersFile(buildParametersFileObj(parameters), parameters.resourceName || parameters.functionName, functionParametersFileName);
}

// ideally function update should be refactored so this function does not need to be exported
export function saveCFNParameters(
  parameters: Partial<Pick<FunctionParameters, 'cloudwatchRule' | 'resourceName'>> | FunctionTriggerParameters,
) {
  if ('trigger' in parameters) {
    const params = {
      modules: parameters.modules.join(),
      resourceName: parameters.resourceName,
    };
    createParametersFile(params, parameters.resourceName, parametersFileName);
  }
  if ('cloudwatchRule' in parameters) {
    const params = {
      CloudWatchRule: parameters.cloudwatchRule,
    };
    createParametersFile(params, parameters.resourceName, parametersFileName);
  }
}

// function updateLayerState(context: $TSContext, parameters: LayerParameters, layerDirPath: string) {
//   if (isMultiEnvLayer(parameters.layerName)) {
//     updateLayerTeamProviderInfo(context, parameters, layerDirPath);
//     saveLayerRuntimes(layerDirPath, parameters.layerName, parameters.runtimes);
//   } else {
//     createLayerParametersFile(parameters, layerDirPath, isMultiEnvLayer(parameters.layerName));
//   }
// }

function copyTemplateFiles(context: $TSContext, parameters: FunctionParameters | FunctionTriggerParameters) {
  // copy function template files
  const destDir = pathManager.getBackendDirPath();
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
  let templateParams: $TSAny = parameters;
  if ('trigger' in parameters) {
    let triggerEnvs = context.amplify.loadEnvResourceParameters(context, 'function', parameters.resourceName);
    parameters.triggerEnvs = JSONUtilities.parse(parameters.triggerEnvs) || [];

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

  const copyJobParams: $TSAny = parameters;
  if ('lambdaLayers' in parameters) {
    const layerCFNValues = convertLambdaLayerMetaToLayerCFNArray(parameters.lambdaLayers, context.amplify.getEnvInfo().envName);
    copyJobParams.lambdaLayersCFNArray = layerCFNValues;
  }
  context.amplify.copyBatch(context, [cloudTemplateJob], copyJobParams, false);
}

function ensureLayerFolders(parameters: LayerParameters) {
  const projectBackendDirPath = pathManager.getBackendDirPath();
  const layerDirPath = path.join(projectBackendDirPath, categoryName, parameters.layerName);
  fs.ensureDirSync(path.join(layerDirPath, 'opt'));
  parameters.runtimes.forEach(runtime => ensureLayerRuntimeFolder(layerDirPath, runtime));
  return layerDirPath;
}

// Default files are only created if the path does not exist
function ensureLayerRuntimeFolder(layerDirPath: string, runtime: LayerRuntime) {
  const runtimeDirPath = path.join(layerDirPath, 'lib', runtime.layerExecutablePath);
  if (!fs.pathExistsSync(runtimeDirPath)) {
    fs.ensureDirSync(runtimeDirPath);
    fs.writeFileSync(path.join(runtimeDirPath, 'README.txt'), 'Replace this file with your layer files');
    (runtime.layerDefaultFiles || []).forEach(defaultFile =>
      fs.writeFileSync(path.join(layerDirPath, 'lib', defaultFile.path, defaultFile.filename), defaultFile.content),
    );
  }
}

function createLayerCfnFile(parameters: LayerParameters, layerDirPath: string) {
  JSONUtilities.writeJson(
    path.join(layerDirPath, parameters.layerName + '-awscloudformation-template.json'),
    generateLayerCfnObj(context, parameters, []),
  );
}

async function updateLayerCfnFile(context: $TSContext, parameters: LayerParameters, layerDirPath: string) {
  let layerVersionList = [];
  if (loadPreviousLayerHash(parameters.layerName)) {
    layerVersionList = await loadLayerDataFromCloud(context, parameters.layerName);
  }
  const _isNewVersion = await isNewVersion(parameters.layerName);
  JSONUtilities.writeJson(
    path.join(layerDirPath, parameters.layerName + '-awscloudformation-template.json'),
    generateLayerCfnObj(context, parameters, []), // TODO populate with SDK CALL
  );
}

const setParametersInAmplifyMeta = (layerName: string, parameters: LayerMetaAndBackendConfigParams) => {
  const amplifyMeta = stateManager.getMeta();
  _.set(amplifyMeta, [categoryName, layerName], parameters);
  stateManager.setMeta(undefined, amplifyMeta);
};

const addLayerToAmplifyMeta = (context: $TSContext, parameters: LayerParameters) => {
  context.amplify.updateamplifyMetaAfterResourceAdd(categoryName, parameters.layerName, amplifyMetaAndBackendParams(parameters));
  writeParametersToAmplifyMeta(
    context,
    parameters.layerName,
    layerParamsToAmplifyMetaParams(parameters, isMultiEnvLayer(parameters.layerName)),
  );
};

const updateLayerInAmplifyMeta = (context: $TSContext, parameters: LayerParameters) => {
  writeParametersToAmplifyMeta(
    context,
    parameters.layerName,
    layerParamsToAmplifyMetaParams(parameters, isMultiEnvLayer(parameters.layerName)),
  );
};

const addLayerToAmplifyMeta = (context: $TSContext, parameters: LayerParameters) => {
  context.amplify.updateamplifyMetaAfterResourceAdd(categoryName, parameters.layerName, amplifyMetaAndBackendParams(parameters));
  setParametersInAmplifyMeta(parameters.layerName, amplifyMetaAndBackendParams(parameters));
};

// const updateLayerTeamProviderInfo = (context: $TSContext, parameters: LayerParameters, layerDirPath: string) => {
//   fs.ensureDirSync(layerDirPath);
//   const { envName } = context.amplify.getEnvInfo();

//   const teamProviderInfo = stateManager.getTeamProviderInfo();
//   _.set(
//     teamProviderInfo,
//     [envName, 'nonCFNdata', categoryName, parameters.layerName],
//     layerParamsToStoredParams(parameters, isMultiEnvLayer(parameters.layerName)),
//   );
//   stateManager.setTeamProviderInfo(undefined, teamProviderInfo);
// };

const removeLayerFromTeamProviderInfo = (context: $TSContext, layerName: string) => {
  const { envName } = context.amplify.getEnvInfo();
  const teamProviderInfo = stateManager.getTeamProviderInfo();
  _.unset(teamProviderInfo, [envName, 'nonCFNdata', categoryName, layerName]);
  if (_.isEmpty(_.get(teamProviderInfo, [envName, 'nonCFNdata', categoryName]))) {
    _.unset(teamProviderInfo, [envName, 'nonCFNdata', categoryName]);
    if (_.isEmpty(_.get(teamProviderInfo, [envName, 'nonCFNdata']))) {
      _.unset(teamProviderInfo, [envName, 'nonCFNdata']);
    }
  }
  stateManager.setTeamProviderInfo(undefined, teamProviderInfo);
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

function createParametersFile(parameters: $TSObject, resourceName: string, parametersFileName: string) {
  const parametersFilePath = path.join(pathManager.getBackendDirPath(), categoryName, resourceName, parametersFileName);
  const currentParameters = JSONUtilities.readJson<$TSAny>(parametersFilePath, { throwIfNotExist: false }) || {};
  delete currentParameters.mutableParametersState; // this field was written in error in a previous version of the cli
  JSONUtilities.writeJson(parametersFilePath, { ...currentParameters, ...parameters });
}

function buildParametersFileObj(
  parameters: Partial<Pick<FunctionParameters, 'mutableParametersState' | 'lambdaLayers'>> | FunctionTriggerParameters,
): $TSAny {
  if ('trigger' in parameters) {
    return _.omit(parameters, ['functionTemplate', 'cloudResourceTemplatePath']);
  }
  return { ...parameters.mutableParametersState, ..._.pick(parameters, ['lambdaLayers']) };
}

function translateFuncParamsToResourceOpts(params: FunctionParameters | FunctionTriggerParameters): $TSAny {
  let result: $TSObject = {
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
