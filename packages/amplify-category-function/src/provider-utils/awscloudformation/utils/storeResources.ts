import { FunctionParameters, FunctionTriggerParameters, FunctionBreadcrumbs } from 'amplify-function-plugin-interface';
import path from 'path';
import fs from 'fs-extra';
import { categoryName, provider, ServiceNames } from './constants';
import generateLayerCfnObj from './lambda-layer-cloudformation-template';
import _ from 'lodash';

// handling both FunctionParameters and FunctionTriggerParameters here is a hack
// ideally we refactor the auth trigger flows to use FunctionParameters directly and get rid of FunctionTriggerParameters altogether

export function copyFunctionResources(context: any, parameters: FunctionParameters | FunctionTriggerParameters) {
  context.amplify.updateamplifyMetaAfterResourceAdd(
    categoryName,
    parameters.resourceName || parameters.functionName,
    translateFuncParamsToResourceOpts(parameters),
  );

  // copy template, CFN and parameter files
  copyTemplateFiles(context, parameters);
  createParametersFile(context, buildParametersFileObj(parameters), parameters.resourceName);
  if ('trigger' in parameters) {
    const params = {
      modules: parameters.modules.join(),
      resourceName: parameters.resourceName,
    };
    createParametersFile(context, params, parameters.resourceName, 'parameters.json');
  }
  context.amplify.leaveBreadcrumbs(context, categoryName, parameters.resourceName, createBreadcrumbs(parameters));

  if ('cloudwatchRule' in parameters) {
    const params = {
      CloudWatchRule: parameters.cloudwatchRule,
    };
    createParametersFile(context, params, parameters.resourceName, 'parameters.json');
  }
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
  context.amplify.copyBatch(context, [cloudTemplateJob], parameters, false);
}

export function createLayerFolders(context, parameters) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const layerDirPath = path.join(projectBackendDirPath, categoryName, parameters.layerName);
  const layerDirSrcPath = path.join(layerDirPath, 'src');
  fs.mkdirSync(layerDirSrcPath, { recursive: true });
  fs.mkdirSync(path.join(layerDirPath, 'bin'));
  fs.mkdirSync(path.join(layerDirPath, 'opt'));

  // Temporary hack
  const runtimePaths = {
    nodejs: path.join(layerDirSrcPath, 'nodejs', 'node_modules'),
    python: path.join(layerDirSrcPath, 'python'),
    java: path.join(layerDirSrcPath, 'java', 'lib'),
    dotnet: path.join(layerDirSrcPath, 'dotnet', 'dist'),
  };
  let moduleDirPath;
  for (let runtime of parameters.runtimes) {
    moduleDirPath = path.join(runtimePaths[runtime.value], parameters.layerName);
    fs.mkdirSync(moduleDirPath, { recursive: true });
    fs.writeFileSync(path.join(moduleDirPath, 'README.txt'), 'Replace this file with your layer files');
  }
  return layerDirPath;
}

export function createLayerCfnFile(context, parameters, layerDirPath) {
  fs.ensureDirSync(layerDirPath);
  fs.writeFileSync(
    path.join(layerDirPath, 'layer-awscloudformation.json'),
    JSON.stringify(generateLayerCfnObj(parameters), null, 4),
    'utf8',
  );
  context.amplify.updateamplifyMetaAfterResourceAdd(categoryName, parameters.layerName, {
    providerPlugin: parameters.providerContext.provider,
    service: parameters.providerContext.service,
    runtimes: parameters.runtimes,
  });
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

function buildParametersFileObj(parameters: FunctionParameters | FunctionTriggerParameters): any {
  if ('trigger' in parameters) {
    return _.omit(parameters, ['functionTemplate', 'cloudResourceTemplatePath']);
  }
  return parameters.parametersFileObj;
}

function translateFuncParamsToResourceOpts(params: FunctionParameters | FunctionTriggerParameters): any {
  let result: any = {
    build: true,
    providerPlugin: provider,
    service: ServiceNames.LambdaFunction,
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
