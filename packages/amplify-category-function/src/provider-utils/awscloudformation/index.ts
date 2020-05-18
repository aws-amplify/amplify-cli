import { FunctionParameters, FunctionTriggerParameters } from 'amplify-function-plugin-interface';
import { LayerParameters } from './utils/layerParams';
import { supportedServices } from '../supported-services';
import { FunctionWalkthroughProvider } from '../supportedServicesType';
import { ServiceNames, provider, categoryName } from './utils/constants';
import { copyFunctionResources, createLayerCfnFile, createLayerFolders, createParametersFile } from './utils/storeResources';
import { ServiceConfig } from '../supportedServicesType';
import _ from 'lodash';
import { merge, convertToComplete, isComplete } from './utils/funcParamsUtils';
import fs from 'fs-extra';
import path from 'path';

/**
 * Entry point for creating a new function
 * @param context Amplify Core Context object
 * @param category The resource category (should always be 'function')
 * @param service The cloud service that is providing the category
 * @param options Legacy parameter
 * @param parameters Parameters used to define the function. If not specified, a walkthrough will be launched to populate it.
 */
export async function addResource(context, category, service, options, parameters?: any): Promise<object> {
  // load the service config for this service
  const serviceConfig: ServiceConfig = supportedServices[service];
  const BAD_SERVICE_ERR = `amplify-category-function is not configured to provide service type ${service}`;
  if (!serviceConfig) {
    throw BAD_SERVICE_ERR;
  }
  switch (service) {
    case ServiceNames.LambdaFunction:
      return addFunctionResource(context, category, service, serviceConfig, options, parameters);
    case ServiceNames.LambdaLayer:
      return addLayerResource(context, category, service, serviceConfig, options, parameters);
    default:
      throw BAD_SERVICE_ERR;
  }
}

async function addFunctionResource(
  context,
  category,
  service,
  serviceConfig: ServiceConfig,
  options,
  parameters?: Partial<FunctionParameters> | FunctionTriggerParameters,
): Promise<object> {
  // Go through the walkthrough if the parameters are incomplete function parameters
  let completeParams: FunctionParameters | FunctionTriggerParameters;
  if (!parameters || (!isComplete(parameters) && !('trigger' in parameters))) {
    // initialize the template parameters
    let funcParams: Partial<FunctionParameters> = {
      providerContext: {
        provider: provider,
        service: service,
        projectName: context.amplify.getProjectDetails().projectConfig.projectName,
      },
    };

    // merge in given parameters
    funcParams = merge(funcParams, parameters);

    // merge in the CFN file
    funcParams = merge(funcParams, { cloudResourceTemplatePath: serviceConfig.cfnFilename });

    // populate the parameters for the resource
    // This will modify funcParams
    await serviceConfig.walkthroughs.createWalkthrough(context, funcParams);
    completeParams = convertToComplete(funcParams);
  } else {
    completeParams = parameters;
  }

  copyFunctionResources(context, completeParams);

  if (!completeParams.skipEdit) {
    await openEditor(context, category, completeParams);
  }

  return { name: completeParams.resourceName, service: service };
}

async function addLayerResource(
  context,
  category,
  service,
  serviceConfig: ServiceConfig,
  options,
  parameters?: Partial<LayerParameters>,
): Promise<object> {
  if (parameters === undefined) {
    parameters = {};
  }

  parameters.providerContext = {
    provider: provider,
    service: service,
    projectName: context.amplify.getProjectDetails().projectConfig.projectName,
  };

  await serviceConfig.walkthroughs.createWalkthrough(context, parameters);

  const layerDirPath = createLayerFolders(context, parameters);
  createLayerCfnFile(context, parameters, layerDirPath);

  return { name: parameters.layerName, service, layerDirPath };
}

export async function updateResource(context, category, service, parameters, resourceToUpdate) {
  let answers;
  const serviceConfig: ServiceConfig = supportedServices[service];
  if (!serviceConfig) {
    throw `amplify-category-function is not configured to provide service type ${service}`;
  }

  let result;

  if (!parameters) {
    result = await serviceConfig.walkthroughs.updateWalkthrough(context, resourceToUpdate);
  } else {
    result = { answers: parameters };
  }

  if (result.answers) {
    ({ answers } = result);
  } else {
    answers = result;
  }

  if (!answers.resourceName) {
    answers.resourceName = answers.functionName;
  }

  if (result.dependsOn) {
    context.amplify.updateamplifyMetaAfterResourceUpdate(category, answers.resourceName, 'dependsOn', result.dependsOn);
  }

  if (answers.parameters) {
    let cloudWatchParams = _.pick(answers.parameters, ['CloudWatchRule']);
    let params = _.omit(answers.parameters, ['CloudWatchRule']);
    createParametersFile(context, params, answers.resourceName);
    createParametersFile(context, cloudWatchParams, answers.resourceName, 'parameters.json');
  }

  if (answers.trigger) {
    const parametersFilePath = `${context.amplify.pathManager.getBackendDirPath()}/function/${resourceToUpdate}/parameters.json`;
    let previousParameters;

    if (fs.existsSync(parametersFilePath)) {
      previousParameters = context.amplify.readJsonFile(parametersFilePath);

      if (previousParameters.trigger === true) {
        answers = Object.assign(answers, previousParameters);
      }
    }
    createParametersFile(context, parameters, answers.resourceName);
  }

  if (!parameters || (parameters && !parameters.skipEdit)) {
    const breadcrumb = context.amplify.readBreadcrumbs(context, categoryName, answers.resourceName);
    answers.functionTemplate = {
      defaultEditorFile: breadcrumb.defaultEditorFile,
    };
    await openEditor(context, category, answers);
  }

  return answers.resourceName;
}

async function openEditor(context, category, options: FunctionParameters | FunctionTriggerParameters) {
  let displayName = 'local';
  if ('trigger' in options) {
    displayName = options.resourceName;
  }
  const targetDir = context.amplify.pathManager.getBackendDirPath();
  if (await context.amplify.confirmPrompt.run(`Do you want to edit the ${displayName} lambda function now?`)) {
    let targetFile = '';

    // try to load the default editor file from the function template
    if (options.functionTemplate) {
      const template = options.functionTemplate;
      if (template.defaultEditorFile) {
        targetFile = template.defaultEditorFile;
      } else if (template.sourceFiles && template.sourceFiles.length > 0) {
        let srcFile = options.functionTemplate.sourceFiles[0];
        targetFile = _.get(options.functionTemplate, ['destMap', srcFile], srcFile);
      }
    }

    // if above loading didn't work, just open the folder directory
    const target = path.join(targetDir, category, options.resourceName, targetFile);
    await context.amplify.openEditor(context, target);
  }
}

// TODO refactor this to not depend on supported-service.json
export function migrateResource(context, projectPath, service, resourceName) {
  const serviceConfig: ServiceConfig = supportedServices[service];

  if (!(serviceConfig.walkthroughs as FunctionWalkthroughProvider).migrate) {
    context.print.info(`No migration required for ${resourceName}`);
    return;
  }

  return (serviceConfig.walkthroughs as FunctionWalkthroughProvider).migrate(context, projectPath, resourceName);
}

export function getPermissionPolicies(context, service, resourceName, crudOptions) {
  const serviceConfig: ServiceConfig = supportedServices[service];

  if (!(serviceConfig.walkthroughs as FunctionWalkthroughProvider).getIAMPolicies) {
    context.print.info(`No policies found for ${resourceName}`);
    return;
  }

  return (serviceConfig.walkthroughs as FunctionWalkthroughProvider).getIAMPolicies(resourceName, crudOptions);
}

function isInHeadlessMode(context) {
  return context.exeInfo.inputParams.yes;
}

function getHeadlessParams(context, service) {
  const { inputParams = {} } = context.exeInfo;
  return inputParams.categories && inputParams.categories.function && Array.isArray(inputParams.categories.function)
    ? inputParams.categories.function.find(i => i.resourceName === service) || {}
    : {};
}

export async function updateConfigOnEnvInit(context, category, service) {
  const srvcMetaData: ServiceConfig = supportedServices[service];
  const providerPlugin = context.amplify.getPluginInstance(context, srvcMetaData.provider);
  const functionParametersPath = `${context.amplify.pathManager.getBackendDirPath()}/function/${service}/function-parameters.json`;
  let resourceParams: any = {};
  const functionParametersExists = fs.existsSync(functionParametersPath);
  if (functionParametersExists) {
    resourceParams = context.amplify.readJsonFile(functionParametersPath);
  }
  let envParams = {};

  // headless mode
  if (isInHeadlessMode(context)) {
    const functionParams = getHeadlessParams(context, service);
    return functionParams;
  }

  if (resourceParams.trigger === true) {
    envParams = await initTriggerEnvs(context, resourceParams, providerPlugin, envParams, srvcMetaData);
  }
  return envParams;
}

async function initTriggerEnvs(context, resourceParams, providerPlugin, envParams, srvcMetaData: ServiceConfig) {
  if (resourceParams && resourceParams.parentStack && resourceParams.parentResource) {
    const parentResourceParams = providerPlugin.loadResourceParameters(context, resourceParams.parentStack, resourceParams.parentResource);
    const triggers =
      typeof parentResourceParams.triggers === 'string' ? JSON.parse(parentResourceParams.triggers) : parentResourceParams.triggers;
    const currentTrigger = resourceParams.resourceName.replace(parentResourceParams.resourceName, '');
    if (currentTrigger && currentTrigger !== resourceParams.resourceName) {
      const currentEnvVariables = context.amplify.loadEnvResourceParameters(context, 'function', resourceParams.resourceName);
      const triggerPath = `${__dirname}/../../../../amplify-category-${resourceParams.parentStack}/provider-utils/${srvcMetaData.provider}/triggers/${currentTrigger}`;
      if (context.commandName !== 'checkout') {
        envParams = await context.amplify.getTriggerEnvInputs(
          context,
          triggerPath,
          currentTrigger,
          triggers[currentTrigger],
          currentEnvVariables,
        );
      } else {
        envParams = currentEnvVariables;
      }
    }
  }
  return envParams;
}

module.exports = {
  addResource,
  updateResource,
  migrateResource,
  getPermissionPolicies,
  updateConfigOnEnvInit,
};
