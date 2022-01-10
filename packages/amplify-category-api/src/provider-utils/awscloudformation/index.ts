import { $TSAny, $TSContext, $TSObject, AmplifySupportedService, exitOnNextTick, NotImplementedError } from 'amplify-cli-core';
import { UpdateApiRequest } from 'amplify-headless-interface';
import { printer } from 'amplify-prompts';
import inquirer from 'inquirer';
import * as path from 'path';
import { category } from '../../category-constants';
import { ApigwInputState } from './apigw-input-state';
import { getCfnApiArtifactHandler } from './cfn-api-artifact-handler';
import { addResource as addContainer, updateResource as updateContainer } from './containers-handler';
import { legacyAddResource } from './legacy-add-resource';
import {
  API_TYPE,
  getPermissionPolicies as getContainerPermissionPolicies,
  ServiceConfiguration,
} from './service-walkthroughs/containers-walkthrough';
import { datasourceMetadataFor, getServiceWalkthrough, serviceMetadataFor } from './utils/dynamic-imports';
import { editSchemaFlow } from './utils/edit-schema-flow';
import { serviceWalkthroughResultToAddApiRequest } from './utils/service-walkthrough-result-to-add-api-request';

export async function addAdminQueriesApi(
  context: $TSContext,
  apiProps: { apiName: string; functionName: string; authResourceName: string; dependsOn: $TSObject[] },
) {
  const apigwInputState = new ApigwInputState(context, apiProps.apiName);
  return apigwInputState.addAdminQueriesResource(apiProps);
}

export async function updateAdminQueriesApi(
  context: $TSContext,
  apiProps: { apiName: string; functionName: string; authResourceName: string; dependsOn: $TSObject[] },
) {
  const apigwInputState = new ApigwInputState(context, apiProps.apiName);
  // Check for migration

  if (!apigwInputState.cliInputsFileExists()) {
    await apigwInputState.migrateAdminQueries(apiProps);
  } else {
    return apigwInputState.updateAdminQueriesResource(apiProps);
  }
}

export async function console(context: $TSContext, service: string) {
  const { serviceWalkthroughFilename } = await serviceMetadataFor(service);
  const serviceWalkthroughSrc = path.join(__dirname, 'service-walkthroughs', serviceWalkthroughFilename);
  const { openConsole } = await import(serviceWalkthroughSrc);

  if (!openConsole) {
    const errMessage = 'Opening console functionality not available for this option';
    printer.error(errMessage);
    await context.usageData.emitError(new NotImplementedError(errMessage));
    exitOnNextTick(0);
  }

  return openConsole(context);
}

async function addContainerResource(context: $TSContext, service: string, options, apiType: API_TYPE) {
  const serviceWalkthroughFilename = 'containers-walkthrough.js';

  const serviceWalkthrough = await getServiceWalkthrough(serviceWalkthroughFilename);
  const serviceWalkthroughPromise: Promise<$TSAny> = serviceWalkthrough(context, apiType);

  return await addContainer(serviceWalkthroughPromise, context, category, service, options, apiType);
}

async function addNonContainerResource(context: $TSContext, service: string, options) {
  const serviceMetadata = await serviceMetadataFor(service);
  const { serviceWalkthroughFilename, defaultValuesFilename } = serviceMetadata;
  const serviceWalkthrough = await getServiceWalkthrough(serviceWalkthroughFilename);

  const serviceWalkthroughPromise: Promise<$TSAny> = serviceWalkthrough(context, serviceMetadata);
  switch (service) {
    case AmplifySupportedService.APPSYNC:
      const walkthroughResult = await serviceWalkthroughPromise;
      const askToEdit = walkthroughResult.askToEdit;
      const apiName = await getCfnApiArtifactHandler(context).createArtifacts(serviceWalkthroughResultToAddApiRequest(walkthroughResult));
      if (askToEdit) {
        await editSchemaFlow(context, apiName);
      }
      return apiName;
    case AmplifySupportedService.APIGW:
      const apigwInputState = new ApigwInputState(context);
      return apigwInputState.addApigwResource(serviceWalkthroughPromise, options);
    default:
      return legacyAddResource(serviceWalkthroughPromise, context, category, service, options);
  }
}

export async function addResource(context: $TSContext, service: string, options) {
  let useContainerResource = false;
  let apiType = API_TYPE.GRAPHQL;

  if (isContainersEnabled(context)) {
    switch (service) {
      case AmplifySupportedService.APPSYNC:
        useContainerResource = await isGraphQLContainer();
        apiType = API_TYPE.GRAPHQL;
        break;
      case AmplifySupportedService.APIGW:
        useContainerResource = await isRestContainer();
        apiType = API_TYPE.REST;
        break;
      default:
        throw new Error(`${service} not exists`);
    }
  }

  return useContainerResource
    ? addContainerResource(context, service, options, apiType)
    : addNonContainerResource(context, service, options);
}

function isContainersEnabled(context: $TSContext) {
  const { frontend } = context.amplify.getProjectConfig();
  if (frontend) {
    const { config: { ServerlessContainers = false } = {} } = context.amplify.getProjectConfig()[frontend] || {};

    return ServerlessContainers;
  }

  return false;
}

async function isGraphQLContainer(): Promise<boolean> {
  const { graphqlSelection } = await inquirer.prompt({
    name: 'graphqlSelection',
    message: 'Which service would you like to use',
    type: 'list',
    choices: [
      {
        name: AmplifySupportedService.APPSYNC,
        value: false,
      },
      {
        name: 'AWS Fargate (Container-based)',
        value: true,
      },
    ],
  });

  return graphqlSelection;
}

async function isRestContainer() {
  const { restSelection } = await inquirer.prompt({
    name: 'restSelection',
    message: 'Which service would you like to use',
    type: 'list',
    choices: [
      {
        name: 'API Gateway + Lambda',
        value: false,
      },
      {
        name: 'API Gateway + AWS Fargate (Container-based)',
        value: true,
      },
    ],
  });

  return restSelection;
}

export async function updateResource(context: $TSContext, category: string, service: string, options) {
  const allowContainers = options?.allowContainers ?? true;
  let useContainerResource = false;
  let apiType = API_TYPE.GRAPHQL;
  if (allowContainers && isContainersEnabled(context)) {
    const { hasAPIGatewayContainerResource, hasAPIGatewayLambdaResource, hasGraphQLAppSyncResource, hasGraphqlContainerResource } =
      await describeApiResourcesBySubCategory(context);

    switch (service) {
      case AmplifySupportedService.APPSYNC:
        if (hasGraphQLAppSyncResource && hasGraphqlContainerResource) {
          useContainerResource = await isGraphQLContainer();
        } else if (hasGraphqlContainerResource) {
          useContainerResource = true;
        } else {
          useContainerResource = false;
        }
        apiType = API_TYPE.GRAPHQL;
        break;
      case AmplifySupportedService.APIGW:
        if (hasAPIGatewayContainerResource && hasAPIGatewayLambdaResource) {
          useContainerResource = await isRestContainer();
        } else if (hasAPIGatewayContainerResource) {
          useContainerResource = true;
        } else {
          useContainerResource = false;
        }
        apiType = API_TYPE.REST;
        break;
      default:
        throw new Error(`${service} not exists`);
    }
  }

  return useContainerResource ? updateContainerResource(context, category, service, apiType) : updateNonContainerResource(context, service);
}

async function describeApiResourcesBySubCategory(context: $TSContext) {
  const { allResources } = await context.amplify.getResourceStatus();
  const resources = allResources.filter(resource => resource.category === category && resource.mobileHubMigrated !== true);

  let hasAPIGatewayContainerResource = false;
  let hasAPIGatewayLambdaResource = false;
  let hasGraphQLAppSyncResource = false;
  let hasGraphqlContainerResource = false;

  resources.forEach(resource => {
    hasAPIGatewayContainerResource =
      hasAPIGatewayContainerResource || (resource.service === 'ElasticContainer' && resource.apiType === API_TYPE.REST);

    hasAPIGatewayLambdaResource = hasAPIGatewayLambdaResource || resource.service === AmplifySupportedService.APIGW;

    hasGraphQLAppSyncResource = hasGraphQLAppSyncResource || resource.service === AmplifySupportedService.APPSYNC;

    hasGraphqlContainerResource =
      hasGraphqlContainerResource || (resource.service === 'ElasticContainer' && resource.apiType === API_TYPE.GRAPHQL);
  });

  return {
    hasAPIGatewayLambdaResource,
    hasAPIGatewayContainerResource,
    hasGraphQLAppSyncResource,
    hasGraphqlContainerResource,
  };
}

async function updateContainerResource(context: $TSContext, category: string, service: string, apiType: API_TYPE) {
  const serviceWalkthroughFilename = 'containers-walkthrough';
  const serviceWalkthroughSrc = path.join(__dirname, 'service-walkthroughs', serviceWalkthroughFilename);
  const { updateWalkthrough } = await import(serviceWalkthroughSrc);

  if (!updateWalkthrough) {
    const errMessage = 'Update functionality not available for this option';
    printer.error(errMessage);
    await context.usageData.emitError(new NotImplementedError(errMessage));
    exitOnNextTick(0);
  }

  const updateWalkthroughPromise: Promise<ServiceConfiguration> = updateWalkthrough(context, apiType);

  updateContainer(updateWalkthroughPromise, context, category);
}

async function updateNonContainerResource(context: $TSContext, service: string) {
  const serviceMetadata = await serviceMetadataFor(service);
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = path.join(__dirname, 'service-walkthroughs', serviceWalkthroughFilename);
  const { updateWalkthrough } = await import(serviceWalkthroughSrc);

  if (!updateWalkthrough) {
    const errMessage = 'Update functionality not available for this option';
    printer.error(errMessage);
    await context.usageData.emitError(new NotImplementedError(errMessage));
    exitOnNextTick(0);
  }

  const updateWalkthroughPromise: Promise<UpdateApiRequest> = updateWalkthrough(context, defaultValuesFilename, serviceMetadata);

  switch (service) {
    case AmplifySupportedService.APPSYNC:
      return updateWalkthroughPromise.then(getCfnApiArtifactHandler(context).updateArtifacts);
    default:
      const apigwInputState = new ApigwInputState(context);
      return apigwInputState.updateApigwResource(updateWalkthroughPromise);
  }
}

export async function migrateResource(context: $TSContext, projectPath: string, service: string, resourceName: string) {
  if (service === 'ElasticContainer') {
    return migrateResourceContainer(context, projectPath, service, resourceName);
  } else {
    return migrateResourceNonContainer(context, projectPath, service, resourceName);
  }
}

async function migrateResourceContainer(context: $TSContext, projectPath: string, service: string, resourceName: string) {
  printer.info(`No migration required for ${resourceName}`);
  return;
}

async function migrateResourceNonContainer(context: $TSContext, projectPath: string, service: string, resourceName: string) {
  const serviceMetadata = await serviceMetadataFor(service);
  const { serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = path.join(__dirname, 'service-walkthroughs', serviceWalkthroughFilename);
  const { migrate } = await import(serviceWalkthroughSrc);

  if (!migrate) {
    printer.info(`No migration required for ${resourceName}`);
    return;
  }

  return await migrate(context, projectPath, resourceName);
}

export async function addDatasource(context: $TSContext, category, datasource) {
  const serviceMetadata = await datasourceMetadataFor(datasource);
  const { serviceWalkthroughFilename } = serviceMetadata;
  return (await getServiceWalkthrough(serviceWalkthroughFilename))(context, serviceMetadata);
}

export async function getPermissionPolicies(context: $TSContext, service: string, resourceName: string, crudOptions) {
  if (service === 'ElasticContainer') {
    return getPermissionPoliciesContainer(context, service, resourceName, crudOptions);
  } else {
    return getPermissionPoliciesNonContainer(service, resourceName, crudOptions);
  }
}

async function getPermissionPoliciesContainer(context: $TSContext, service: string, resourceName: string, crudOptions) {
  return getContainerPermissionPolicies(context, service, resourceName, crudOptions);
}

async function getPermissionPoliciesNonContainer(service: string, resourceName: string, crudOptions: string[]) {
  const serviceMetadata = await serviceMetadataFor(service);
  const { serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = path.join(__dirname, 'service-walkthroughs', serviceWalkthroughFilename);
  const { getIAMPolicies } = await import(serviceWalkthroughSrc);

  if (!getIAMPolicies) {
    printer.info(`No policies found for ${resourceName}`);
    return;
  }

  return getIAMPolicies(resourceName, crudOptions);
}
