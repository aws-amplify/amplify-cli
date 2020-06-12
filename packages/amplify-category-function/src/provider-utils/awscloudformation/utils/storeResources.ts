import { FunctionParameters, FunctionTriggerParameters, FunctionBreadcrumbs } from 'amplify-function-plugin-interface';
import path from 'path';
import fs from 'fs-extra';
import { provider, ServiceName, layerParametersFileName } from './constants';
import { category as categoryName } from '../../../constants';
import { generateLayerCfnObj, generatePermissionCfnObj } from './lambda-layer-cloudformation-template';
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

export function copyTemplateFiles(context: any, parameters: FunctionParameters | FunctionTriggerParameters) {
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
    const layerCFNValues = convertLambdaLayerMetaToLayerCFNArray(parameters.lambdaLayers);
    copyJobParams.lambdaLayersCFNArray = layerCFNValues;
  }
  context.amplify.copyBatch(context, [cloudTemplateJob], copyJobParams, false);
}

export function createLayerFolders(context, parameters) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const layerDirPath = path.join(projectBackendDirPath, categoryName, parameters.layerName);
  fs.mkdirSync(path.join(layerDirPath, 'opt'), { recursive: true });

  let moduleDirPath;
  for (let runtime of parameters.runtimes) {
    moduleDirPath = path.join(layerDirPath, 'lib', runtime.layerExecutablePath);
    fs.mkdirSync(moduleDirPath, { recursive: true });
    fs.writeFileSync(path.join(moduleDirPath, 'README.txt'), 'Replace this file with your layer files');

    if (!runtime.layerDefaultFiles) {
      continue;
    }
    for (let defaultFile of runtime.layerDefaultFiles) {
      moduleDirPath = path.join(layerDirPath, 'lib', defaultFile.path);
      if (!fs.pathExistsSync(moduleDirPath)) {
        fs.mkdirSync(moduleDirPath);
      }
      fs.writeFileSync(path.join(moduleDirPath, defaultFile.filename), defaultFile.content);
    }
  }
  return layerDirPath;
}

export function createLayerCfnFile(context, parameters, layerDirPath) {
  context.amplify.writeObjectAsJson(
    path.join(layerDirPath, parameters.layerName + '-awscloudformation-template.json'),
    generateLayerCfnObj(context, parameters),
    true,
  );
  context.amplify.updateamplifyMetaAfterResourceAdd(categoryName, parameters.layerName, {
    providerPlugin: parameters.providerContext.provider,
    service: parameters.providerContext.service,
    runtimes: parameters.runtimes,
    versionsMap: parameters.layerVersionMap,
    build: true,
  });
}

export function saveMutableState(
  context,
  parameters: Partial<Pick<FunctionParameters, 'mutableParametersState' | 'resourceName' | 'lambdaLayers'>> | FunctionTriggerParameters,
) {
  createParametersFile(context, buildParametersFileObj(parameters), parameters.resourceName);
}

export function saveCFNParameters(
  context,
  parameters: Partial<Pick<FunctionParameters, 'cloudwatchRule' | 'resourceName'>> | FunctionTriggerParameters,
) {
  if ('trigger' in parameters) {
    const params = {
      modules: parameters.modules.join(),
      resourceName: parameters.resourceName,
    };
    createParametersFile(context, params, parameters.resourceName, 'parameters.json');
  }
  if ('cloudwatchRule' in parameters) {
    const params = {
      CloudWatchRule: parameters.cloudwatchRule,
    };
    createParametersFile(context, params, parameters.resourceName, 'parameters.json');
  }
}

export function updateLayerCfnFile(context, parameters, layerDirPath) {
  context.amplify.writeObjectAsJson(
    path.join(layerDirPath, parameters.layerName + '-awscloudformation-template.json'),
    generateLayerCfnObj(context, parameters),
    true,
  );
  context.amplify.updateamplifyMetaAfterResourceUpdate(categoryName, parameters.layerName, 'runtimes', parameters.runtimes);
  context.amplify.updateamplifyMetaAfterResourceUpdate(categoryName, parameters.layerName, 'versionsMap', parameters.layerVersionMap);
  context.amplify.updateamplifyMetaAfterResourceUpdate(categoryName, parameters.layerName, 'build', parameters.build);
}

export function createLayerParametersFile(context, parameters, layerDirPath) {
  fs.ensureDirSync(layerDirPath);
  const parametersFilePath = path.join(layerDirPath, layerParametersFileName);
  //const jsonString = JSON.stringify({ parameters }, null, 4);
  context.amplify.writeObjectAsJson(parametersFilePath, { parameters }, true);
}

export function createParametersFile(context, parameters, resourceName, parametersFileName = 'function-parameters.json') {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, categoryName, resourceName);
  fs.ensureDirSync(resourceDirPath);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  const currentParameters = fs.existsSync(parametersFilePath) ? context.amplify.readJsonFile(parametersFilePath) : {};
  const jsonString = JSON.stringify({ ...currentParameters, ...parameters }, null, 4);
  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
}

function buildParametersFileObj(
  parameters: Partial<Pick<FunctionParameters, 'mutableParametersState' | 'lambdaLayers'>> | FunctionTriggerParameters,
): any {
  if ('trigger' in parameters) {
    return _.omit(parameters, ['functionTemplate', 'cloudResourceTemplatePath']);
  }
  return _.pick(parameters, ['mutableParametersState', 'lambdaLayers']);
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
