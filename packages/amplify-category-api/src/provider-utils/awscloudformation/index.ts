import path from 'path';
import fs from 'fs-extra';
import { serviceWalkthroughResultToAddApiRequest } from './utils/service-walkthrough-result-to-add-api-request';
import { getCfnApiArtifactHandler } from './cfn-api-artifact-handler';
import { serviceMetadataFor, getServiceWalkthrough, datasourceMetadataFor } from './utils/dynamic-imports';
import { parametersFileName } from './aws-constants';
import { legacyAddResource, copyCfnTemplate } from './legacy-add-resource';

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
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthrough = await getServiceWalkthrough(serviceWalkthroughFilename);

  const serviceWalkthroughPromise: Promise<any> = serviceWalkthrough(context, defaultValuesFilename, serviceMetadata);
  switch (service) {
    case 'AppSync':
      return serviceWalkthroughPromise
        .then(serviceWalkthroughResultToAddApiRequest)
        .then(getCfnApiArtifactHandler(context).createArtifacts);
    default:
      return legacyAddResource(serviceWalkthroughPromise, context, category, service, options);
  }
}

export async function updateResource(context, category, service) {
  let answers;
  const serviceMetadata = await serviceMetadataFor(service);
  let { cfnFilename } = serviceMetadata;
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { updateWalkthrough } = require(serviceWalkthroughSrc);
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  if (!updateWalkthrough) {
    context.print.error('Update functionality not available for this option');
    process.exit(0);
  }

  return updateWalkthrough(context, defaultValuesFilename, serviceMetadata).then(result => {
    const options: any = {};
    if (result) {
      if (result.answers) {
        ({ answers } = result);
        options.dependsOn = result.dependsOn;
      } else {
        answers = result;
      }

      if (!result.noCfnFile) {
        if (answers.customCfnFile) {
          cfnFilename = answers.customCfnFile;
        }
        copyCfnTemplate(context, category, answers, cfnFilename);
        const parameters = { ...answers };
        const resourceDirPath = path.join(projectBackendDirPath, category, parameters.resourceName);
        fs.ensureDirSync(resourceDirPath);
        const parametersFilePath = path.join(resourceDirPath, parametersFileName);
        const jsonString = JSON.stringify(parameters, null, 4);
        fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
        context.amplify.updateamplifyMetaAfterResourceUpdate(category, answers.resourceName, 'dependsOn', answers.dependsOn);
      }
    }
  });
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

  if (!getPermissionPolicies) {
    context.print.info(`No policies found for ${resourceName}`);
    return;
  }

  return getIAMPolicies(resourceName, crudOptions);
}
