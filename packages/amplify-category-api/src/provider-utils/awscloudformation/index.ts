import { serviceWalkthroughResultToAddApiRequest } from './utils/service-walkthrough-result-to-add-api-request';
import { getCfnApiArtifactHandler } from './cfn-api-artifact-handler';
import { serviceMetadataFor, getServiceWalkthrough, datasourceMetadataFor } from './utils/dynamic-imports';
import { legacyAddResource } from './legacy-add-resource';
import { legacyUpdateResource } from './legacy-update-resource';
import { UpdateApiRequest } from 'amplify-headless-interface';
import { editSchemaFlow } from './utils/edit-schema-flow';
import { NotImplementedError, exitOnNextTick } from 'amplify-cli-core';
import { addResource as addContainer, updateResource as updateContainer } from './containers-handler';
import inquirer from 'inquirer';
import {
  API_TYPE,
  ServiceConfiguration,
  getPermissionPolicies as getContainerPermissionPolicies,
} from './service-walkthroughs/containers-walkthrough';
import { category } from '../../category-constants';

export async function console(context, service) {
  const { serviceWalkthroughFilename } = await serviceMetadataFor(service);
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { openConsole } = require(serviceWalkthroughSrc);

  if (!openConsole) {
    const errMessage = 'Opening console functionality not available for this option';
    context.print.error(errMessage);
    await context.usageData.emitError(new NotImplementedError(errMessage));
    exitOnNextTick(0);
  }

  return openConsole(context);
}

async function addContainerResource(context, category, service, options, apiType) {
  const serviceWalkthroughFilename = 'containers-walkthrough.js';
  const defaultValuesFilename = 'containers-defaults.js';

  const serviceWalkthrough = await getServiceWalkthrough(serviceWalkthroughFilename);
  const serviceWalkthroughPromise: Promise<any> = serviceWalkthrough(context, defaultValuesFilename, apiType);

  return await addContainer(serviceWalkthroughPromise, context, category, service, options, apiType);
}

async function addNonContainerResource(context, category, service, options) {
  const serviceMetadata = await serviceMetadataFor(service);
  const { serviceWalkthroughFilename, defaultValuesFilename } = serviceMetadata;
  const serviceWalkthrough = await getServiceWalkthrough(serviceWalkthroughFilename);

  const serviceWalkthroughPromise: Promise<any> = serviceWalkthrough(context, defaultValuesFilename, serviceMetadata);
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

export async function addResource(context, category, service, options) {
  let useContainerResource = false;
  let apiType = API_TYPE.GRAPHQL;

  if (isContainersEnabled(context)) {
    switch (service) {
      case 'AppSync':
        useContainerResource = await isGraphQLContainer(context);
        apiType = API_TYPE.GRAPHQL;
        break;
      case 'API Gateway':
        useContainerResource = await isRestContainer(context);
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

function isContainersEnabled(context) {
  const { frontend } = context.amplify.getProjectConfig();
  if (frontend) {
    const { config: { ServerlessContainers = false } = {} } = context.amplify.getProjectConfig()[frontend] || {};

    return ServerlessContainers;
  }

  return false;
}

async function isGraphQLContainer(context): Promise<boolean> {
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

async function isRestContainer(context) {
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

export async function updateResource(context, category, service, options) {
  const allowContainers = options?.allowContainers ?? true;
  let useContainerResource = false;
  let apiType = API_TYPE.GRAPHQL;
  if (allowContainers && isContainersEnabled(context)) {
    const {
      hasAPIGatewayContainerResource,
      hasAPIGatewayLambdaResource,
      hasGraphQLAppSyncResource,
      hasGraphqlContainerResource,
    } = await describeApiResourcesBySubCategory(context);

    switch (service) {
      case 'AppSync':
        if (hasGraphQLAppSyncResource && hasGraphqlContainerResource) {
          useContainerResource = await isGraphQLContainer(context);
        } else if (hasGraphqlContainerResource) {
          useContainerResource = true;
        } else {
          useContainerResource = false;
        }
        apiType = API_TYPE.GRAPHQL;
        break;
      case 'API Gateway':
        if (hasAPIGatewayContainerResource && hasAPIGatewayLambdaResource) {
          useContainerResource = await isRestContainer(context);
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

async function describeApiResourcesBySubCategory(context) {
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

async function updateContainerResource(context, category, service, apiType: API_TYPE) {
  const serviceWalkthroughFilename = 'containers-walkthrough';
  const defaultValuesFilename = 'containers-defaults.js';
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { updateWalkthrough } = require(serviceWalkthroughSrc);

  if (!updateWalkthrough) {
    const errMessage = 'Update functionality not available for this option';
    context.print.error(errMessage);
    await context.usageData.emitError(new NotImplementedError(errMessage));
    exitOnNextTick(0);
  }

  const updateWalkthroughPromise: Promise<ServiceConfiguration> = updateWalkthrough(context, defaultValuesFilename, apiType);

  updateContainer(updateWalkthroughPromise, context, category);
}

async function updateNonContainerResource(context, category, service) {
  const serviceMetadata = await serviceMetadataFor(service);
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { updateWalkthrough } = require(serviceWalkthroughSrc);

  if (!updateWalkthrough) {
    const errMessage = 'Update functionality not available for this option';
    context.print.error(errMessage);
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

export async function migrateResource(context, projectPath, service, resourceName) {
  if (service === 'ElasticContainer') {
    return migrateResourceContainer(context, projectPath, service, resourceName);
  } else {
    return migrateResourceNonContainer(context, projectPath, service, resourceName);
  }
}

async function migrateResourceContainer(context, projectPath, service, resourceName) {
  context.print.info(`No migration required for ${resourceName}`);
  return;
}

async function migrateResourceNonContainer(context, projectPath, service, resourceName) {
  const serviceMetadata = await serviceMetadataFor(service);
  const { serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { migrate } = require(serviceWalkthroughSrc);

  if (!migrate) {
    context.print.info(`No migration required for ${resourceName}`);
    return;
  }

  return await migrate(context, projectPath, resourceName);
}

export async function addDatasource(context, category, datasource) {
  const serviceMetadata = await datasourceMetadataFor(datasource);
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  return (await getServiceWalkthrough(serviceWalkthroughFilename))(context, defaultValuesFilename, serviceMetadata);
}

export async function getPermissionPolicies(context, service, resourceName, crudOptions) {
  if (service === 'ElasticContainer') {
    return getPermissionPoliciesContainer(context, service, resourceName, crudOptions);
  } else {
    return getPermissionPoliciesNonContainer(context, service, resourceName, crudOptions);
  }
}

async function getPermissionPoliciesContainer(context, service, resourceName, crudOptions) {
  return getContainerPermissionPolicies(context, service, resourceName, crudOptions);
}

async function getPermissionPoliciesNonContainer(context, service, resourceName, crudOptions) {
  const serviceMetadata = await serviceMetadataFor(service);
  const { serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { getIAMPolicies } = require(serviceWalkthroughSrc);

  if (!getIAMPolicies) {
    context.print.info(`No policies found for ${resourceName}`);
    return;
  }

  return getIAMPolicies(resourceName, crudOptions, context);
}
