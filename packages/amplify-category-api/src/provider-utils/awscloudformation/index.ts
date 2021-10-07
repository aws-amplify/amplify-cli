import { serviceWalkthroughResultToAddApiRequest } from './utils/service-walkthrough-result-to-add-api-request';
import { getCfnApiArtifactHandler } from './cfn-api-artifact-handler';
import { serviceMetadataFor, getServiceWalkthrough, datasourceMetadataFor } from './utils/dynamic-imports';
import { legacyAddResource } from './legacy-add-resource';
import { legacyUpdateResource } from './legacy-update-resource';
import { UpdateApiRequest } from 'amplify-headless-interface';
import { editSchemaFlow } from './utils/edit-schema-flow';
import { NotImplementedError, exitOnNextTick, $TSContext, $TSAny } from 'amplify-cli-core';
import { addResource as addContainer, updateResource as updateContainer } from './containers-handler';
import inquirer from 'inquirer';
import * as path from 'path';
import {
  API_TYPE,
  ServiceConfiguration,
  getPermissionPolicies as getContainerPermissionPolicies,
} from './service-walkthroughs/containers-walkthrough';
import { category } from '../../category-constants';
import { printer } from 'amplify-prompts';

export async function console(context: $TSContext, service) {
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

async function addContainerResource(context: $TSContext, category, service, options, apiType) {
  const serviceWalkthroughFilename = 'containers-walkthrough.js';

  const serviceWalkthrough = await getServiceWalkthrough(serviceWalkthroughFilename);
  const serviceWalkthroughPromise: Promise<$TSAny> = serviceWalkthrough(context, apiType);

  return await addContainer(serviceWalkthroughPromise, context, category, service, options, apiType);
}

async function addNonContainerResource(context: $TSContext, category, service, options) {
  const serviceMetadata = await serviceMetadataFor(service);
  const { serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthrough = await getServiceWalkthrough(serviceWalkthroughFilename);

  const serviceWalkthroughPromise: Promise<$TSAny> = serviceWalkthrough(context, serviceMetadata);
  switch (service) {
    case 'AppSync':
      const walkthroughResult = await serviceWalkthroughPromise;
      const askToEdit = walkthroughResult.askToEdit;
      const apiName = await getCfnApiArtifactHandler(context).createArtifacts(serviceWalkthroughResultToAddApiRequest(walkthroughResult));
      if (askToEdit) {
        await editSchemaFlow(context, apiName);
      }
      return apiName;
    default:
      return legacyAddResource(serviceWalkthroughPromise, context, category, service, options);
  }
}

export async function addResource(context: $TSContext, category, service: string, options) {
  let useContainerResource = false;
  let apiType = API_TYPE.GRAPHQL;

  if (isContainersEnabled(context)) {
    switch (service) {
      case 'AppSync':
        useContainerResource = await isGraphQLContainer();
        apiType = API_TYPE.GRAPHQL;
        break;
      case 'API Gateway':
        useContainerResource = await isRestContainer();
        apiType = API_TYPE.REST;
        break;
      default:
        throw new Error(`${service} not exists`);
    }
  }

  return useContainerResource
    ? addContainerResource(context, category, service, options, apiType)
    : addNonContainerResource(context, category, service, options);
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
        name: 'AppSync',
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

export async function updateResource(context: $TSContext, category, service: string, options) {
  const allowContainers = options?.allowContainers ?? true;
  let useContainerResource = false;
  let apiType = API_TYPE.GRAPHQL;
  if (allowContainers && isContainersEnabled(context)) {
    const { hasAPIGatewayContainerResource, hasAPIGatewayLambdaResource, hasGraphQLAppSyncResource, hasGraphqlContainerResource } =
      await describeApiResourcesBySubCategory(context);

    switch (service) {
      case 'AppSync':
        if (hasGraphQLAppSyncResource && hasGraphqlContainerResource) {
          useContainerResource = await isGraphQLContainer();
        } else if (hasGraphqlContainerResource) {
          useContainerResource = true;
        } else {
          useContainerResource = false;
        }
        apiType = API_TYPE.GRAPHQL;
        break;
      case 'API Gateway':
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

  return useContainerResource
    ? updateContainerResource(context, category, service, apiType)
    : updateNonContainerResource(context, category, service);
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

    hasAPIGatewayLambdaResource = hasAPIGatewayLambdaResource || resource.service === 'API Gateway';

    hasGraphQLAppSyncResource = hasGraphQLAppSyncResource || resource.service === 'AppSync';

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

async function updateContainerResource(context: $TSContext, category, service, apiType: API_TYPE) {
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

async function updateNonContainerResource(context: $TSContext, category, service) {
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
    case 'AppSync':
      return updateWalkthroughPromise.then(getCfnApiArtifactHandler(context).updateArtifacts);
    default:
      return legacyUpdateResource(updateWalkthroughPromise, context, category, service);
  }
}

export async function migrateResource(context: $TSContext, projectPath, service, resourceName) {
  if (service === 'ElasticContainer') {
    return migrateResourceContainer(context, projectPath, service, resourceName);
  } else {
    return migrateResourceNonContainer(context, projectPath, service, resourceName);
  }
}

async function migrateResourceContainer(context: $TSContext, projectPath, service, resourceName) {
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

export async function getPermissionPolicies(context: $TSContext, service, resourceName, crudOptions) {
  if (service === 'ElasticContainer') {
    return getPermissionPoliciesContainer(context, service, resourceName, crudOptions);
  } else {
    return getPermissionPoliciesNonContainer(service, resourceName, crudOptions);
  }
}

async function getPermissionPoliciesContainer(context: $TSContext, service, resourceName, crudOptions) {
  return getContainerPermissionPolicies(context, service, resourceName, crudOptions);
}

async function getPermissionPoliciesNonContainer(service: string, resourceName: string, crudOptions) {
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
