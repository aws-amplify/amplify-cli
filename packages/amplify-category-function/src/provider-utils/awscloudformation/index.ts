import {
  $TSAny,
  $TSContext,
  JSONUtilities,
  open,
  PathConstants,
  pathManager,
  readCFNTemplate,
  stateManager,
  writeCFNTemplate,
  createDefaultCustomPoliciesFile,
} from '@aws-amplify/amplify-cli-core';
import {
  FunctionParameters,
  FunctionTemplate,
  FunctionTriggerParameters,
  LambdaLayer,
} from '@aws-amplify/amplify-function-plugin-interface';
import { printer } from '@aws-amplify/amplify-prompts';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { IsMockableResponse } from '../..';
import { categoryName } from '../../constants';
import { supportedServices } from '../supported-services';
import { ServiceConfig } from '../supportedServicesType';
import { functionParametersFileName, provider, ServiceName, versionHash } from './utils/constants';
import { convertExternalLayersToProjectLayers, convertProjectLayersToExternalLayers } from './utils/convertLayersTypes';
import { convertToComplete, isComplete, merge } from './utils/funcParamsUtils';
import { loadLayerParametersJson } from './utils/layerConfiguration';
import { isMultiEnvLayer } from './utils/layerHelpers';
import { LayerParameters } from './utils/layerParams';
import {
  createFunctionResources,
  createLayerArtifacts,
  saveCFNParameters,
  saveMutableState,
  updateLayerArtifacts,
} from './utils/storeResources';

/**
 * Entry point for creating a new function
 * @param context Amplify Core Context object
 * @param category The resource category (should always be 'function')
 * @param service The cloud service that is providing the category
 * @param options Legacy parameter
 * @param parameters Parameters used to define the function. If not specified, a walkthrough will be launched to populate it.
 */
export async function addResource(
  context: $TSContext,
  category: string,
  service: ServiceName,
  options: $TSAny,
  parameters?: Partial<FunctionParameters> | FunctionTriggerParameters | Partial<LayerParameters>,
): Promise<string> {
  // load the service config for this service
  const serviceConfig: ServiceConfig<FunctionParameters> | ServiceConfig<LayerParameters> = supportedServices[service];
  const BAD_SERVICE_ERR = new Error(`amplify-category-function is not configured to provide service type ${service}`);
  if (!serviceConfig) {
    throw BAD_SERVICE_ERR;
  }
  switch (service) {
    case ServiceName.LambdaFunction:
      return addFunctionResource(context, category, service, serviceConfig as ServiceConfig<FunctionParameters>, parameters);
    case ServiceName.LambdaLayer:
      return addLayerResource(context, service, serviceConfig as ServiceConfig<LayerParameters>, parameters as LayerParameters);
    default:
      throw BAD_SERVICE_ERR;
  }
}

export async function addFunctionResource(
  context: $TSContext,
  category: string,
  service: ServiceName,
  serviceConfig: ServiceConfig<FunctionParameters>,
  parameters?: Partial<FunctionParameters> | FunctionTriggerParameters,
): Promise<string> {
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

  await createFunctionResources(context, completeParams);

  createDefaultCustomPoliciesFile(category, completeParams.resourceName);

  if (!completeParams.skipEdit) {
    await openEditor(context, category, completeParams.resourceName, completeParams.functionTemplate);
  }

  if (completeParams.skipNextSteps) {
    return completeParams.resourceName;
  }

  const customPoliciesPath = pathManager.getCustomPoliciesPath(category, completeParams.resourceName);

  printer.success(`Successfully added resource ${completeParams.resourceName} locally.`);
  printer.info('');
  printer.success('Next steps:');
  printer.info(`Check out sample function code generated in <project-dir>/amplify/backend/function/${completeParams.resourceName}/src`);
  printer.info('"amplify function build" builds all of your functions currently in the project');
  printer.info('"amplify mock function <functionName>" runs your function locally');
  printer.info(`To access AWS resources outside of this Amplify app, edit the ${customPoliciesPath}`);
  printer.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
  printer.info(
    '"amplify publish" builds all of your local backend and front-end resources (if you added hosting category) and provisions them in the cloud',
  );

  return completeParams.resourceName;
}

export async function addLayerResource(
  context: $TSContext,
  service: ServiceName,
  serviceConfig: ServiceConfig<LayerParameters>,
  parameters: Partial<LayerParameters> = {},
): Promise<string> {
  parameters.providerContext = {
    provider: provider,
    service: service,
    projectName: context.amplify.getProjectDetails().projectConfig.projectName,
  };

  const completeParams = (await serviceConfig.walkthroughs.createWalkthrough(context, parameters)) as LayerParameters;

  createLayerArtifacts(context, completeParams);
  printLayerSuccessMessages(context, completeParams, 'created');
  return completeParams.layerName;
}

export async function updateResource(
  context: $TSContext,
  category: string,
  service: ServiceName,
  parameters?: Partial<FunctionParameters> | FunctionTriggerParameters | Partial<LayerParameters>,
  resourceToUpdate?: $TSAny,
) {
  // load the service config for this service
  const serviceConfig: ServiceConfig<FunctionParameters> | ServiceConfig<LayerParameters> = supportedServices[service];
  const BAD_SERVICE_ERR = new Error(`amplify-category-function is not configured to provide service type ${service}`);
  if (!serviceConfig) {
    throw BAD_SERVICE_ERR;
  }
  switch (service) {
    case ServiceName.LambdaFunction:
      return updateFunctionResource(context, category, service, parameters, resourceToUpdate);
    case ServiceName.LambdaLayer:
      return updateLayerResource(context, service, serviceConfig as ServiceConfig<LayerParameters>, parameters as LayerParameters);
    default:
      throw BAD_SERVICE_ERR;
  }
}

export async function updateFunctionResource(
  context: $TSContext,
  category: string,
  service: ServiceName,
  parameters: $TSAny,
  resourceToUpdate: $TSAny,
) {
  const serviceConfig: ServiceConfig<FunctionParameters> = supportedServices[service] as ServiceConfig<FunctionParameters>;
  if (!serviceConfig) {
    throw `amplify-category-function is not configured to provide service type ${service}`;
  }

  if (parameters && 'trigger' in parameters) {
    const parametersFilePath = path.join(pathManager.getBackendDirPath(), categoryName, resourceToUpdate, functionParametersFileName);
    let previousParameters;

    if (fs.existsSync(parametersFilePath)) {
      previousParameters = JSONUtilities.readJson(parametersFilePath);

      if ('trigger' in previousParameters) {
        parameters = _.assign({}, previousParameters, parameters);

        if (parameters.triggerEnvs && parameters.triggerEnvs instanceof String) {
          parameters.triggerEnvs = JSONUtilities.parse(parameters.triggerEnvs) || [];
        }
      }
    }

    await saveMutableState(context, parameters);
    saveCFNParameters(parameters);
  } else {
    parameters = await serviceConfig.walkthroughs.updateWalkthrough(context, parameters, resourceToUpdate);
    if (parameters.dependsOn) {
      context.amplify.updateamplifyMetaAfterResourceUpdate(category, parameters.resourceName, 'dependsOn', parameters.dependsOn);
    }
    await saveMutableState(context, parameters);
    saveCFNParameters(parameters);
  }

  if (!parameters || (parameters && !parameters.skipEdit)) {
    const breadcrumb = context.amplify.readBreadcrumbs(categoryName, parameters.resourceName);
    const displayName = 'trigger' in parameters ? parameters.resourceName : undefined;
    await openEditor(context, category, parameters.resourceName, { defaultEditorFile: breadcrumb.defaultEditorFile }, displayName, false);
  }

  return parameters.resourceName;
}

export async function updateLayerResource(
  context: $TSContext,
  service: ServiceName,
  serviceConfig: ServiceConfig<LayerParameters>,
  parameters?: Partial<LayerParameters>,
) {
  if (!serviceConfig) {
    throw new Error(`amplify-category-function is not configured to provide service type ${service}`);
  }

  if (!parameters) {
    parameters = {};
    parameters.providerContext = {
      provider: provider,
      service: service,
      projectName: context.amplify.getProjectDetails().projectConfig.projectName,
    };
  }

  const updateWalkthroughResult = (await serviceConfig.walkthroughs.updateWalkthrough(context, undefined, parameters)) as {
    parameters: LayerParameters;
    resourceUpdated: boolean;
  };

  if (updateWalkthroughResult.resourceUpdated === false) {
    return;
  }

  // write out updated resources
  await updateLayerArtifacts(context, updateWalkthroughResult.parameters, {
    updateLayerParams: parameters.selectedVersion === undefined,
    generateCfnFile: parameters.selectedVersion !== undefined,
  });

  printLayerSuccessMessages(context, updateWalkthroughResult.parameters, 'updated');
}

function printLayerSuccessMessages(context: $TSContext, parameters: LayerParameters, action: string): void {
  const { print } = context;
  const { layerName } = parameters;
  const relativeDirPath = path.join(PathConstants.AmplifyDirName, PathConstants.BackendDirName, categoryName, layerName);
  print.info(`✅ Lambda layer folders & files ${action}:`);
  print.info(relativeDirPath);
  print.info('');
  print.success('Next steps:');

  if (parameters.runtimes.length !== 0) {
    print.info('Move your libraries to the following folder:');
    for (const runtime of parameters.runtimes) {
      const runtimePath = path.join(relativeDirPath, 'lib', runtime.layerExecutablePath);
      print.info(`[${runtime.name}]: ${runtimePath}`);
    }
    print.info('');
  }

  print.info('Include any files you want to share across runtimes in this folder:');
  print.info(path.join(relativeDirPath, 'opt'));
  print.info('');
  print.info('"amplify function update <function-name>" - configure a function with this Lambda layer');
  print.info('"amplify push" - builds all of your local backend resources and provisions them in the cloud');
}

async function openEditor(
  context: $TSContext,
  category: string,
  resourceName: string,
  template: Partial<FunctionTemplate>,
  displayName = 'local',
  defaultConfirm = true,
) {
  const targetDir = pathManager.getBackendDirPath();
  if (await context.amplify.confirmPrompt(`Do you want to edit the ${displayName} lambda function now?`, defaultConfirm)) {
    let targetFile = '';

    // try to load the default editor file from the function template
    if (template) {
      if (template.defaultEditorFile) {
        targetFile = template.defaultEditorFile;
      } else if (template.sourceFiles && template.sourceFiles.length > 0) {
        const srcFile = template.sourceFiles[0];
        targetFile = _.get(template, ['destMap', srcFile], srcFile);
      }
    }

    // if above loading didn't work, just open the folder directory
    const target = path.join(targetDir, category, resourceName, targetFile);
    await context.amplify.openEditor(context, target);
  }
}

export function migrateResource(context: $TSContext, projectPath: string, service: ServiceName, resourceName: string) {
  if (service !== ServiceName.LambdaFunction) {
    throw new Error(`Could not get permission policies for unsupported service: ${service}`);
  }

  const serviceConfig: ServiceConfig<FunctionParameters> = supportedServices[service];

  if (!serviceConfig.walkthroughs.migrate) {
    context.print.info(`No migration required for ${resourceName}`);
    return undefined;
  }

  return serviceConfig.walkthroughs.migrate(context, projectPath, resourceName);
}

export function getPermissionPolicies(context: $TSContext, service: ServiceName, resourceName: string, crudOptions: $TSAny) {
  if (service !== ServiceName.LambdaFunction) {
    throw new Error(`Could not get permission policies for unsupported service: ${service}`);
  }

  const serviceConfig: ServiceConfig<FunctionParameters> = supportedServices[service];

  if (!serviceConfig.walkthroughs.getIAMPolicies) {
    context.print.info(`No policies found for ${resourceName}`);
    return undefined;
  }

  return serviceConfig.walkthroughs.getIAMPolicies(resourceName, crudOptions);
}

function isInHeadlessMode(context: $TSContext) {
  return context.exeInfo.inputParams.yes;
}

function getHeadlessParams(context: $TSContext, resourceName: string) {
  const { inputParams = {} } = context.exeInfo;
  return inputParams.categories && inputParams.categories.function && Array.isArray(inputParams.categories.function)
    ? inputParams.categories.function.find((i) => i.resourceName === resourceName) || {}
    : {};
}

export async function updateConfigOnEnvInit(context: $TSContext, resourceName: string, service: ServiceName) {
  if (service === ServiceName.LambdaFunction) {
    const serviceMetaData: ServiceConfig<FunctionParameters> = supportedServices[service];
    const providerPlugin = context.amplify.getPluginInstance(context, serviceMetaData.provider);
    const functionParametersPath = path.join(pathManager.getBackendDirPath(), categoryName, resourceName, 'function-parameters.json');
    let resourceParams: $TSAny = {};
    const functionParametersExists = fs.existsSync(functionParametersPath);
    if (functionParametersExists) {
      resourceParams = JSONUtilities.readJson(functionParametersPath);
    }
    let envParams = {};

    // headless mode
    if (isInHeadlessMode(context)) {
      const functionParams = getHeadlessParams(context, resourceName);
      return functionParams;
    }

    if (resourceParams.trigger === true) {
      envParams = await initTriggerEnvs(context, resourceParams, providerPlugin, envParams, serviceMetaData);
    }

    if (Array.isArray(resourceParams.lambdaLayers) && resourceParams.lambdaLayers.length) {
      const envName = context.amplify.getEnvInfo().envName;
      const modifiedLambdaLayers: LambdaLayer[] = [];
      modifiedLambdaLayers.push(...convertProjectLayersToExternalLayers(resourceParams.lambdaLayers, envName));
      modifiedLambdaLayers.push(...convertExternalLayersToProjectLayers(resourceParams.lambdaLayers, envName));
      resourceParams.lambdaLayers = modifiedLambdaLayers;
      JSONUtilities.writeJson(functionParametersPath, resourceParams);
    }

    return envParams;
  } else if (isMultiEnvLayer(resourceName) && service === ServiceName.LambdaLayer) {
    const projectPath = pathManager.findProjectRoot();
    const currentAmplifyMeta = stateManager.getCurrentMeta(projectPath);
    const amplifyMeta = stateManager.getMeta(projectPath);
    const currentCloudVersionHash: string = _.get(currentAmplifyMeta, [categoryName, resourceName, versionHash], undefined);
    if (currentCloudVersionHash) {
      _.setWith(amplifyMeta, [categoryName, resourceName, versionHash], currentCloudVersionHash);
    }

    // Since the CFN template and parameters.json are updated on each new layer version which are specific to each env, we need to update
    // the files accordingly to ensure the correct status is shown after env checkout. The restore flag already handles this scenario.
    if (context.input.command === 'env' && context.input?.subCommands.includes('checkout') && !context.exeInfo?.inputParams?.restore) {
      const currentParametersJson =
        stateManager.getCurrentResourceParametersJson(projectPath, categoryName, resourceName, { throwIfNotExist: false }) || undefined;
      if (currentParametersJson) {
        const backendParametersJson = loadLayerParametersJson(resourceName);
        backendParametersJson.description = currentParametersJson.description;
        stateManager.setResourceParametersJson(projectPath, categoryName, resourceName, backendParametersJson);
      }

      const currentCfnTemplatePath = pathManager.getCurrentCfnTemplatePath(projectPath, categoryName, resourceName);
      const { cfnTemplate: currentCfnTemplate } = readCFNTemplate(currentCfnTemplatePath, { throwIfNotExist: false }) || {};
      if (currentCfnTemplate !== undefined) {
        await writeCFNTemplate(currentCfnTemplate, pathManager.getResourceCfnTemplatePath(projectPath, categoryName, resourceName));
      }
    }
  }
  return undefined;
}

async function initTriggerEnvs(context, resourceParams, providerPlugin, envParams, serviceMetaData: ServiceConfig<FunctionParameters>) {
  if (resourceParams && resourceParams.parentStack && resourceParams.parentResource) {
    const parentResourceParams = providerPlugin.loadResourceParameters(context, resourceParams.parentStack, resourceParams.parentResource);
    const triggers =
      typeof parentResourceParams.triggers === 'string' ? JSON.parse(parentResourceParams.triggers) : parentResourceParams.triggers;
    const currentTrigger = resourceParams.resourceName.replace(parentResourceParams.resourceName, '');
    if (currentTrigger && currentTrigger !== resourceParams.resourceName) {
      const currentEnvVariables = context.amplify.loadEnvResourceParameters(context, categoryName, resourceParams.resourceName);
      const categoryPlugin = context.amplify.getCategoryPluginInfo(context, resourceParams.parentStack);
      const triggerPath = path.join(
        categoryPlugin.packageLocation,
        'provider-utils',
        `${serviceMetaData.provider}`,
        'triggers',
        `${currentTrigger}`,
      );
      const isEnvCommand = context.input.command === 'env';

      if (!isEnvCommand) {
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

export async function openConsole(context: $TSContext, service: ServiceName) {
  const amplifyMeta = stateManager.getMeta();
  const region = amplifyMeta.providers[provider].Region;
  const selection = service === ServiceName.LambdaFunction ? 'functions' : 'layers';
  const url = `https://${region}.console.aws.amazon.com/lambda/home?region=${region}#/${selection}`;
  await open(url, { wait: false });
}

export function isMockable(service: ServiceName): IsMockableResponse {
  return {
    isMockable: service === ServiceName.LambdaFunction,
    reason: 'Lambda layers cannot be mocked locally', // this will only be shown when isMockable is false
  };
}
