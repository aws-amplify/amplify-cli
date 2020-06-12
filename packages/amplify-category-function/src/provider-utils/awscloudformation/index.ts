import { FunctionParameters, FunctionTriggerParameters, FunctionTemplate } from 'amplify-function-plugin-interface';
import { LayerParameters } from './utils/layerParams';
import { supportedServices } from '../supported-services';
import { ServiceName, provider } from './utils/constants';
import { category as categoryName } from '../../constants';
import {
  createFunctionResources,
  createLayerCfnFile,
  createLayerFolders,
  saveMutableState,
  saveCFNParameters,
  createParametersFile,
  updateLayerCfnFile,
  createLayerParametersFile,
} from './utils/storeResources';
import { ServiceConfig } from '../supportedServicesType';
import _ from 'lodash';
import { merge, convertToComplete, isComplete } from './utils/funcParamsUtils';
import fs from 'fs-extra';
import path from 'path';
import open from 'open';
import { IsMockableResponse } from '../..';

/**
 * Entry point for creating a new function
 * @param context Amplify Core Context object
 * @param category The resource category (should always be 'function')
 * @param service The cloud service that is providing the category
 * @param options Legacy parameter
 * @param parameters Parameters used to define the function. If not specified, a walkthrough will be launched to populate it.
 */
export async function addResource(
  context,
  category,
  service,
  options,
  parameters?: Partial<FunctionParameters> | FunctionTriggerParameters | Partial<LayerParameters>,
): Promise<void> {
  // load the service config for this service
  const serviceConfig: ServiceConfig<FunctionParameters> | ServiceConfig<LayerParameters> = supportedServices[service];
  const BAD_SERVICE_ERR = `amplify-category-function is not configured to provide service type ${service}`;
  if (!serviceConfig) {
    throw BAD_SERVICE_ERR;
  }
  switch (service) {
    case ServiceName.LambdaFunction:
      return addFunctionResource(context, category, service, serviceConfig, options, parameters);
    case ServiceName.LambdaLayer:
      return addLayerResource(context, category, service, serviceConfig, options, parameters as LayerParameters);
    default:
      throw BAD_SERVICE_ERR;
  }
}

export async function addFunctionResource(
  context,
  category,
  service,
  serviceConfig: ServiceConfig<FunctionParameters>,
  options,
  parameters?: Partial<FunctionParameters> | FunctionTriggerParameters,
): Promise<void> {
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

    // merge in the default CFN params
    funcParams = merge(funcParams, {
      environmentMap: {
        ENV: {
          Ref: 'env',
        },
        REGION: {
          Ref: 'AWS::Region',
        },
      },
    });

    // make sure the lambda layers array is initialized
    funcParams = merge(funcParams, { lambdaLayers: [] });

    // populate the parameters for the resource
    // This will modify funcParams
    await serviceConfig.walkthroughs.createWalkthrough(context, funcParams);
    completeParams = convertToComplete(funcParams);
  } else {
    completeParams = parameters;
  }

  createFunctionResources(context, completeParams);

  if (!completeParams.skipEdit) {
    await openEditor(context, category, completeParams.resourceName, completeParams.functionTemplate);
  }

  const { print } = context;

  print.success(`Successfully added resource ${completeParams.resourceName} locally.`);
  print.info('');
  print.success('Next steps:');
  print.info(`Check out sample function code generated in <project-dir>/amplify/backend/function/${completeParams.resourceName}/src`);
  print.info('"amplify function build" builds all of your functions currently in the project');
  print.info('"amplify mock function <functionName>" runs your function locally');
  print.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
  print.info(
    '"amplify publish" builds all of your local backend and front-end resources (if you added hosting category) and provisions them in the cloud',
  );
}

export async function addLayerResource(
  context,
  category,
  service,
  serviceConfig: ServiceConfig<LayerParameters>,
  options,
  parameters?: Partial<LayerParameters>,
): Promise<void> {
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
  const layerParams = _.pick(parameters, ['runtimes', 'layerVersionMap']);
  createLayerParametersFile(context, layerParams, layerDirPath);
  createParametersFile(context, {}, parameters.layerName, 'parameters.json');
  createLayerCfnFile(context, parameters, layerDirPath);

  const { print } = context;
  print.info('✅ Lambda layer folders & files created:');
  print.info(layerDirPath);
  print.info('');
  print.success('Next steps:');

  if (parameters.runtimes.length !== 0) {
    print.info('Move your libraries in the following folder:');
    for (let runtime of parameters.runtimes) {
      print.info(`[${runtime.name}]: ${layerDirPath}/lib/${runtime.layerExecutablePath}`);
    }
    print.info('');
  }

  print.info('Include any files you want to share across runtimes in this folder:');
  print.info(`amplify/backend/function/${parameters.layerName}/opt/data`);
  print.info('');
  print.info('"amplify function update <function-name>" - configure a function with this Lambda layer');
  print.info('"amplify push" - builds all of your local backend resources and provisions them in the cloud');
}

export async function updateResource(
  context,
  category,
  service,
  parameters?: Partial<FunctionParameters> | FunctionTriggerParameters | Partial<LayerParameters>,
  resourceToUpdate?,
) {
  // load the service config for this service
  const serviceConfig: ServiceConfig<FunctionParameters> | ServiceConfig<LayerParameters> = supportedServices[service];
  const BAD_SERVICE_ERR = `amplify-category-function is not configured to provide service type ${service}`;
  if (!serviceConfig) {
    throw BAD_SERVICE_ERR;
  }
  switch (service) {
    case ServiceName.LambdaFunction:
      return updateFunctionResource(context, category, service, parameters, resourceToUpdate);
    case ServiceName.LambdaLayer:
      return updateLayerResource(context, category, service, serviceConfig, parameters as LayerParameters);
    default:
      throw BAD_SERVICE_ERR;
  }
}

export async function updateLayerResource(
  context,
  category,
  service,
  serviceConfig: ServiceConfig<LayerParameters>,
  parameters?: Partial<LayerParameters>,
): Promise<void> {
  if (!serviceConfig) {
    throw `amplify-category-function is not configured to provide service type ${service}`;
  }

  if (!parameters) {
    parameters = {};
    parameters.providerContext = {
      provider: provider,
      service: service,
      projectName: context.amplify.getProjectDetails().projectConfig.projectName,
    };
  }
  await serviceConfig.walkthroughs.updateWalkthrough(context, undefined, parameters);

  // generate layer parameters file and CFn file for the updated layer
  const layerDirPath = createLayerFolders(context, parameters); // update based
  const layerParams = _.pick(parameters, ['runtimes', 'layerVersionMap']);
  createLayerParametersFile(context, layerParams, layerDirPath);
  updateLayerCfnFile(context, parameters, layerDirPath);
  const { print } = context;
  print.info('✅ Lambda layer folders & files created:');
  print.info(layerDirPath);
  print.info('');
  print.success('Next steps:');

  if (parameters.runtimes.length !== 0) {
    print.info('Move your libraries in the following folder:');
    for (let runtime of parameters.runtimes) {
      print.info(`[${runtime.name}]: ${layerDirPath}/lib/${runtime.layerExecutablePath}`);
    }
    print.info('');
  }

  print.info('Include any files you want to share across runtimes in this folder:');
  print.info(`amplify/backend/function/${parameters.layerName}/opt/data`);
  print.info('');
  print.info('"amplify function update <function-name>" - configure a function with this Lambda layer');
  print.info('"amplify push" - builds all of your local backend resources and provisions them in the cloud');
}

export async function updateFunctionResource(context, category, service, parameters, resourceToUpdate) {
  const serviceConfig: ServiceConfig<FunctionParameters> = supportedServices[service];
  if (!serviceConfig) {
    throw `amplify-category-function is not configured to provide service type ${service}`;
  }

  if (parameters && 'trigger' in parameters) {
    const parametersFilePath = `${context.amplify.pathManager.getBackendDirPath()}/function/${resourceToUpdate}/parameters.json`;
    let previousParameters;

    if (fs.existsSync(parametersFilePath)) {
      previousParameters = context.amplify.readJsonFile(parametersFilePath);

      if ('trigger' in previousParameters) {
        parameters = _.assign(parameters, previousParameters);
      }
    }
    saveMutableState(context, parameters);
  } else {
    parameters = await serviceConfig.walkthroughs.updateWalkthrough(context, parameters, resourceToUpdate);
    if (parameters.dependsOn) {
      context.amplify.updateamplifyMetaAfterResourceUpdate(category, parameters.resourceName, 'dependsOn', parameters.dependsOn);
    }
    saveMutableState(context, parameters);
    saveCFNParameters(context, parameters);
  }

  if (!parameters || (parameters && !parameters.skipEdit)) {
    const breadcrumb = context.amplify.readBreadcrumbs(context, categoryName, parameters.resourceName);
    const displayName = 'trigger' in parameters ? parameters.resourceName : undefined;
    await openEditor(context, category, parameters.resourceName, { defaultEditorFile: breadcrumb.defaultEditorFile }, displayName);
  }

  return parameters.resourceName;
}

async function openEditor(context, category: string, resourceName: string, template: Partial<FunctionTemplate>, displayName = 'local') {
  const targetDir = context.amplify.pathManager.getBackendDirPath();
  if (await context.amplify.confirmPrompt.run(`Do you want to edit the ${displayName} lambda function now?`)) {
    let targetFile = '';

    // try to load the default editor file from the function template
    if (template) {
      if (template.defaultEditorFile) {
        targetFile = template.defaultEditorFile;
      } else if (template.sourceFiles && template.sourceFiles.length > 0) {
        let srcFile = template.sourceFiles[0];
        targetFile = _.get(template, ['destMap', srcFile], srcFile);
      }
    }

    // if above loading didn't work, just open the folder directory
    const target = path.join(targetDir, category, resourceName, targetFile);
    await context.amplify.openEditor(context, target);
  }
}

// TODO refactor this to not depend on supported-service.json
export function migrateResource(context, projectPath, service, resourceName) {
  const serviceConfig: ServiceConfig<FunctionParameters> = supportedServices[service];

  if (!serviceConfig.walkthroughs.migrate) {
    context.print.info(`No migration required for ${resourceName}`);
    return;
  }

  return serviceConfig.walkthroughs.migrate(context, projectPath, resourceName);
}

export function getPermissionPolicies(context, service, resourceName, crudOptions) {
  const serviceConfig: ServiceConfig<FunctionParameters> = supportedServices[service];

  if (!serviceConfig.walkthroughs.getIAMPolicies) {
    context.print.info(`No policies found for ${resourceName}`);
    return;
  }

  return serviceConfig.walkthroughs.getIAMPolicies(resourceName, crudOptions);
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
  const srvcMetaData: ServiceConfig<FunctionParameters> = supportedServices[service];
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

async function initTriggerEnvs(context, resourceParams, providerPlugin, envParams, srvcMetaData: ServiceConfig<FunctionParameters>) {
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

export function openConsole(context, service: ServiceName) {
  const amplifyMeta = context.amplify.getProjectMeta();
  const region = amplifyMeta.providers[provider].Region;
  const selection = service === ServiceName.LambdaFunction ? 'functions' : 'layers';
  const url = `https://${region}.console.aws.amazon.com/lambda/home?region=${region}#/${selection}`;
  open(url, { wait: false });
}

export function isMockable(service: ServiceName): IsMockableResponse {
  return {
    isMockable: service === ServiceName.LambdaFunction,
    reason: 'Lambda Layers cannot be mocked locally', // this will only be shown when isMockable is false
  };
}
