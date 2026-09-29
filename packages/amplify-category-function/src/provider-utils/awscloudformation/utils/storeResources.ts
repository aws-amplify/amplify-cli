/* eslint-disable import/no-cycle */
import { $TSAny, $TSContext, $TSObject, JSONUtilities, pathManager, stateManager } from '@aws-amplify/amplify-cli-core';
import { FunctionBreadcrumbs, FunctionParameters, FunctionTriggerParameters } from '@aws-amplify/amplify-function-plugin-interface';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { categoryName } from '../../../constants';
import { cfnTemplateSuffix, functionParametersFileName, parametersFileName, provider, ServiceName } from './constants';
import { generateLayerCfnObj } from './lambda-layer-cloudformation-template';
import { convertLambdaLayerMetaToLayerCFNArray } from './layerArnConverter';
import { FunctionSecretsStateManager } from '../secrets/functionSecretsStateManager';
import { isFunctionPushed } from './funcionStateUtils';
import { hasExistingSecrets, hasSetSecrets } from '../secrets/secretDeltaUtilities';
import { LayerCloudState } from './layerCloudState';
import { isNewVersion, loadPreviousLayerHash } from './layerHelpers';
import { createLayerConfiguration, loadLayerParametersJson, saveLayerPermissions } from './layerConfiguration';
import { LayerParameters, LayerRuntime, LayerVersionMetadata } from './layerParams';
import { saveEnvironmentVariables } from './environmentVariablesHelper';
import { truncateResourceNames } from './truncateResourceNames';

/**
 * handling both FunctionParameters and FunctionTriggerParameters here is a hack
 * ideally we refactor the auth trigger flows to use FunctionParameters directly and get rid of FunctionTriggerParameters altogether
 */
export const createFunctionResources = async (
  context: $TSContext,
  parameters: FunctionParameters | FunctionTriggerParameters,
): Promise<void> => {
  context.amplify.updateamplifyMetaAfterResourceAdd(
    categoryName,
    parameters.resourceName || parameters.functionName,
    translateFuncParamsToResourceOpts(parameters),
  );

  // copy template, CFN and parameter files
  copyTemplateFiles(context, parameters);
  await saveMutableState(context, parameters);
  saveCFNParameters(parameters);
  context.amplify.leaveBreadcrumbs(categoryName, parameters.resourceName, createBreadcrumbs(parameters));
};

/**
 * Initializes layer files in the project
 */
export const createLayerArtifacts = (context: $TSContext, parameters: LayerParameters): string => {
  const layerDirPath = ensureLayerFolders(parameters);
  createLayerState(parameters, layerDirPath);
  createLayerCfnFile(parameters, layerDirPath);
  addLayerToAmplifyMeta(context, parameters);
  return layerDirPath;
};

// updates the layer resources and returns the resource directory
const defaultOpts = {
  updateLayerParams: true,
  generateCfnFile: true,
  updateMeta: true,
  updateDescription: true,
};

/**
 * Updates layer files in the project
 */
export const updateLayerArtifacts = async (
  context: $TSContext,
  parameters: LayerParameters,
  options: Partial<typeof defaultOpts> = {},
): Promise<boolean> => {
  // eslint-disable-next-line no-param-reassign
  options = _.assign(defaultOpts, options);
  const layerDirPath = ensureLayerFolders(parameters);
  let updated = false;

  if (options.updateLayerParams) {
    updated ||= saveLayerPermissions(layerDirPath, parameters.permissions);
  }

  if (options.updateDescription) {
    updated ||= saveLayerDescription(parameters.layerName, parameters.description);
  }

  if (options.generateCfnFile) {
    const cfnTemplateFilePath = path.join(layerDirPath, getCfnTemplateFileName(parameters.layerName));
    const currentCFNTemplate = JSONUtilities.readJson(cfnTemplateFilePath, {
      throwIfNotExist: false,
    });

    const updatedCFNTemplate = await updateLayerCfnFile(context, parameters, layerDirPath);

    updated ||= _.isEqual(currentCFNTemplate, updatedCFNTemplate);
  }

  if (options.updateMeta) {
    updateLayerInAmplifyMeta(parameters);
  }

  return updated;
};

/**
 * ideally function update should be refactored so this function does not need to be exported
 */
export const saveMutableState = async (
  context: $TSContext,
  parameters:
    | Partial<
        Pick<
          FunctionParameters,
          'mutableParametersState' | 'resourceName' | 'lambdaLayers' | 'functionName' | 'secretDeltas' | 'environmentVariables'
        >
      >
    | FunctionTriggerParameters,
): Promise<void> => {
  createParametersFile(buildParametersFileObj(parameters), parameters.resourceName || parameters.functionName, functionParametersFileName);
  saveEnvironmentVariables(parameters.resourceName, parameters.environmentVariables);
  await syncSecrets(context, parameters);
};

/**
 * ideally function update should be refactored so this function does not need to be exported
 */
export const saveCFNParameters = (
  // eslint-disable-next-line spellcheck/spell-checker
  parameters: Partial<Pick<FunctionParameters, 'cloudwatchRule' | 'resourceName'>> | FunctionTriggerParameters,
): void => {
  if ('trigger' in parameters) {
    const params = {
      modules: parameters.modules.join(),
      resourceName: parameters.resourceName,
    };
    createParametersFile(params, parameters.resourceName, parametersFileName);
  }
  // eslint-disable-next-line spellcheck/spell-checker
  if ('cloudwatchRule' in parameters) {
    const params = {
      // eslint-disable-next-line spellcheck/spell-checker
      CloudWatchRule: parameters.cloudwatchRule,
    };
    createParametersFile(params, parameters.resourceName, parametersFileName);
  }
};

const syncSecrets = async (
  context: $TSContext,
  parameters: Partial<FunctionParameters> | Partial<FunctionTriggerParameters>,
): Promise<void> => {
  if ('secretDeltas' in parameters) {
    const doConfirm = hasSetSecrets(parameters.secretDeltas) && isFunctionPushed(parameters.resourceName);
    const confirmed = doConfirm
      ? await context.amplify.confirmPrompt('This will immediately update secret values in the cloud. Do you want to continue?', true)
      : true;
    if (confirmed) {
      const functionSecretsStateManager = await FunctionSecretsStateManager.getInstance(context);
      await functionSecretsStateManager.syncSecretDeltas((parameters as FunctionParameters)?.secretDeltas, parameters.resourceName);
    }

    if (hasExistingSecrets(parameters.secretDeltas)) {
      context.print.info('Use the AWS SSM GetParameter API to retrieve secrets in your Lambda function.');
      context.print.info(
        'More information can be found here: https://docs.aws.amazon.com/systems-manager/latest/APIReference/API_GetParameter.html',
      );
    }
  }
};

const createLayerState = (parameters: LayerParameters, layerDirPath: string): void => {
  writeLayerRuntimesToParametersFile(parameters);
  saveLayerDescription(parameters.layerName, parameters.description);
  createLayerConfiguration(layerDirPath, { permissions: parameters.permissions, runtimes: parameters.runtimes });
};

const writeLayerRuntimesToParametersFile = (parameters: LayerParameters): void => {
  const runtimes = parameters.runtimes.reduce((runtimesAccumulator, r) => {
    // eslint-disable-next-line no-param-reassign
    runtimesAccumulator = runtimesAccumulator.concat(r.cloudTemplateValues);
    return runtimesAccumulator;
  }, []);
  if (runtimes.length > 0) {
    stateManager.setResourceParametersJson(undefined, categoryName, parameters.layerName, { runtimes });
  }
};

const saveLayerDescription = (layerName: string, description?: string): boolean => {
  const layerConfig = loadLayerParametersJson(layerName);
  let updated = false;

  if (layerConfig.description !== description) {
    stateManager.setResourceParametersJson(undefined, categoryName, layerName, {
      ...layerConfig,
      description,
    });

    updated = true;
  }

  return updated;
};

const copyTemplateFiles = (context: $TSContext, parameters: FunctionParameters | FunctionTriggerParameters): void => {
  // copy function template files
  const destDir = pathManager.getBackendDirPath();
  const copyJobs = parameters.functionTemplate.sourceFiles.map((file) => ({
    dir: parameters.functionTemplate.sourceRoot,
    template: file,
    target: path.join(
      destDir,
      categoryName,
      parameters.resourceName,
      _.get(parameters.functionTemplate.destMap, file, file.replace(/\.ejs$/, '')),
    ),
  }));

  parameters = {
    ...parameters,
    ...truncateResourceNames(parameters),
  };

  // this is a hack to reuse some old code
  let templateParams: $TSAny = parameters;
  if ('trigger' in parameters) {
    const triggerEnvs = context.amplify.loadEnvResourceParameters(context, categoryName, parameters.resourceName);
    // eslint-disable-next-line no-param-reassign
    parameters.triggerEnvs = JSONUtilities.parse(parameters.triggerEnvs) || [];

    parameters.triggerEnvs.forEach((c) => {
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
};

/**
 * Create layer folders if they don't exist
 */
export const ensureLayerFolders = (parameters: LayerParameters): string => {
  const projectBackendDirPath = pathManager.getBackendDirPath();
  const layerDirPath = path.join(projectBackendDirPath, categoryName, parameters.layerName);
  fs.ensureDirSync(path.join(layerDirPath, 'opt'));
  parameters.runtimes.forEach((runtime) => ensureLayerRuntimeFolder(layerDirPath, runtime));
  return layerDirPath;
};

// Default files are only created if the path does not exist
const ensureLayerRuntimeFolder = (layerDirPath: string, runtime: LayerRuntime): void => {
  const runtimeDirPath = path.join(layerDirPath, 'lib', runtime.layerExecutablePath);
  if (!fs.pathExistsSync(runtimeDirPath)) {
    fs.ensureDirSync(runtimeDirPath);
    fs.writeFileSync(path.join(runtimeDirPath, 'README.txt'), 'Replace this file with your layer files');
    (runtime.layerDefaultFiles || []).forEach((defaultFile) =>
      fs.writeFileSync(path.join(layerDirPath, 'lib', defaultFile.path, defaultFile.filename), defaultFile.content),
    );
  }
};

const createLayerCfnFile = (parameters: LayerParameters, layerDirPath: string): void => {
  const layerCfnObj = generateLayerCfnObj(true, parameters);
  const layerCfnFilePath = path.join(layerDirPath, getCfnTemplateFileName(parameters.layerName));

  JSONUtilities.writeJson(layerCfnFilePath, layerCfnObj);
};

const updateLayerCfnFile = async (context: $TSContext, parameters: LayerParameters, layerDirPath: string): Promise<$TSObject> => {
  let layerVersionList: LayerVersionMetadata[] = [];

  if (loadPreviousLayerHash(parameters.layerName)) {
    const layerCloudState = LayerCloudState.getInstance(parameters.layerName);

    layerVersionList = await layerCloudState.getLayerVersionsFromCloud(context, parameters.layerName);
  }
  const _isNewVersion = await isNewVersion(parameters.layerName);

  const cfnTemplate = saveCFNFileWithLayerVersion(layerDirPath, parameters, _isNewVersion, layerVersionList);

  return cfnTemplate;
};

const setParametersInAmplifyMeta = (layerName: string, parameters: LayerMetaAndBackendConfigParams): void => {
  const amplifyMeta = stateManager.getMeta();
  _.setWith(amplifyMeta, [categoryName, layerName], parameters);
  stateManager.setMeta(undefined, amplifyMeta);
};

const assignParametersInAmplifyMeta = (layerName: string, parameters: LayerMetaAndBackendConfigParams): void => {
  const amplifyMeta = stateManager.getMeta();
  const layer = _.get(amplifyMeta, [categoryName, layerName], {});
  _.assign(layer, parameters);
  _.setWith(amplifyMeta, [categoryName, layerName], layer);
  stateManager.setMeta(undefined, amplifyMeta);
};

const addLayerToAmplifyMeta = (context: $TSContext, parameters: LayerParameters): void => {
  context.amplify.updateamplifyMetaAfterResourceAdd(categoryName, parameters.layerName, amplifyMetaAndBackendParams(parameters));
  setParametersInAmplifyMeta(parameters.layerName, amplifyMetaAndBackendParams(parameters));
};

const updateLayerInAmplifyMeta = (parameters: LayerParameters): void => {
  assignParametersInAmplifyMeta(parameters.layerName, amplifyMetaAndBackendParams(parameters));
};

interface LayerMetaAndBackendConfigParams {
  providerPlugin: string;
  service: string;
  build: boolean;
  versionHash?: string;
}

const amplifyMetaAndBackendParams = (parameters: LayerParameters): LayerMetaAndBackendConfigParams => {
  const metadata: LayerMetaAndBackendConfigParams = {
    providerPlugin: parameters.providerContext.provider,
    service: parameters.providerContext.service,
    build: parameters.build,
  };

  if (parameters.versionHash) {
    metadata.versionHash = parameters.versionHash;
  }

  return metadata;
};

/**
 * Merge the parameters with what is stored in the given file and save it. If the file doesn't exist, it is created with the parameters set.
 */
export const createParametersFile = (parameters: $TSObject, resourceName: string, paramFileName: string): void => {
  const parametersFilePath = path.join(pathManager.getBackendDirPath(), categoryName, resourceName, paramFileName);
  const currentParameters = JSONUtilities.readJson<$TSAny>(parametersFilePath, { throwIfNotExist: false }) || {};
  delete currentParameters.mutableParametersState; // this field was written in error in a previous version of the cli
  JSONUtilities.writeJson(parametersFilePath, { ...currentParameters, ...parameters });
};

const buildParametersFileObj = (
  parameters: Partial<Pick<FunctionParameters, 'mutableParametersState' | 'lambdaLayers'>> | FunctionTriggerParameters,
): $TSAny => {
  if ('trigger' in parameters) {
    return _.omit(parameters, ['functionTemplate', 'cloudResourceTemplatePath']);
  }
  return { ...parameters.mutableParametersState, ..._.pick(parameters, ['lambdaLayers']) };
};

const translateFuncParamsToResourceOpts = (params: FunctionParameters | FunctionTriggerParameters): $TSAny => {
  const result: $TSObject = {
    build: true,
    providerPlugin: provider,
    service: ServiceName.LambdaFunction,
  };
  if (!('trigger' in params)) {
    result.dependsOn = params.dependsOn;
  }
  return result;
};

const createBreadcrumbs = (params: FunctionParameters | FunctionTriggerParameters): FunctionBreadcrumbs => {
  if ('trigger' in params) {
    return {
      pluginId: 'amplify-nodejs-function-runtime-provider',
      functionRuntime: 'nodejs',
      useLegacyBuild: true,
      defaultEditorFile: 'src/index.js',
      scripts: params.scripts,
    };
  }
  return {
    pluginId: params.runtimePluginId,
    functionRuntime: params.runtime.value,
    useLegacyBuild: params.runtime.value === 'nodejs', // so we can update node builds in the future
    defaultEditorFile: params.functionTemplate.defaultEditorFile,
    scripts: params.scripts,
  };
};

const saveCFNFileWithLayerVersion = (
  layerDirPath: string,
  parameters: LayerParameters,
  _isNewVersion: boolean,
  layerVersionList: LayerVersionMetadata[],
): $TSAny => {
  const cfnTemplate = generateLayerCfnObj(_isNewVersion, parameters, layerVersionList);

  JSONUtilities.writeJson(path.join(layerDirPath, getCfnTemplateFileName(parameters.layerName)), cfnTemplate);

  return cfnTemplate;
};

const getCfnTemplateFileName = (layerName: string): string => `${layerName}${cfnTemplateSuffix}`;
