import { serviceWalkthroughResultToAddApiRequest } from './utils/service-walkthrough-result-to-add-api-request';
import { getCfnApiArtifactHandler } from './cfn-api-artifact-handler';
import { serviceMetadataFor, getServiceWalkthrough, datasourceMetadataFor } from './utils/dynamic-imports';
import { legacyAddResource } from './legacy-add-resource';
import { legacyUpdateResource } from './legacy-update-resource';
import { UpdateApiRequest } from 'amplify-headless-interface';
import { editSchemaFlow } from './utils/edit-schema-flow';

export async function console(context, service) {
  const { serviceWalkthroughFilename } = await serviceMetadataFor(service);
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { openConsole } = require(serviceWalkthroughSrc);

  if (!openConsole) {
    context.print.error('Opening console functionality not available for this option');
    process.exit(0);
  }

  return openConsole(context);
}

export async function addResource(context, category, service, options) {
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

export async function updateResource(context, category, service) {
  const serviceMetadata = await serviceMetadataFor(service);
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { updateWalkthrough } = require(serviceWalkthroughSrc);

  if (!updateWalkthrough) {
    context.print.error('Update functionality not available for this option');
    process.exit(0);
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
  const serviceMetadata = await serviceMetadataFor(service);
  const { serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { getIAMPolicies } = require(serviceWalkthroughSrc);

  if (!getIAMPolicies) {
    context.print.info(`No policies found for ${resourceName}`);
    return;
  }

  return getIAMPolicies(resourceName, crudOptions);
}
