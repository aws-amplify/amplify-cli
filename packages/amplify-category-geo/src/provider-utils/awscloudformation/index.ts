import { convertToCompleteMapParams, isCompleteMapParams, MapParameters, ProviderContext } from './utils/mapParams';
import { merge } from './utils/resourceUtils';
import { supportedServices, ServiceConfig } from '../supportedServices';
import { ServiceName, provider } from './utils/constants';
import _ from 'lodash';
import { open, exitOnNextTick } from 'amplify-cli-core';
import { createMapResource, modifyMapResource, getCurrentMapParameters } from './utils/mapResourceUtils';
import { $TSContext } from 'amplify-cli-core';
import { removeWalkthrough } from '../../provider-utils/awscloudformation/service-walkthroughs/removeWalkthrough';
import { category } from '../../constants';
import { updateDefaultMapWalkthrough } from '../awscloudformation/service-walkthroughs/mapWalkthrough';

/**
 * Entry point for creating a new Geo resource
 * @param context Amplify Core Context object
 * @param service The cloud service that is providing the category
 * @param parameters Parameters used to configure the resource. If not specified, a walkthrough will be launched to populate it.
 */
export async function addResource(
  context: $TSContext,
  service: string,
  parameters?: Partial<MapParameters>
): Promise<string> {
  // load the service config for this service
  const BAD_SERVICE_ERR = new Error(`amplify-category-geo is not configured to provide service type ${service}`);

  while (!checkIfAuthExists(context)) {
    if (
      await context.amplify.confirmPrompt(
        'You need to add auth (Amazon Cognito) to your project in order to add geo resources. Do you want to add auth now?',
      )
    ) {
      await context.amplify.invokePluginMethod(context, 'auth', undefined, 'add', [context]);
      break;
    } else {
      context.usageData.emitSuccess();
      exitOnNextTick(0);
    }
  }

  switch (service) {
    case ServiceName.Map:
      const serviceConfig: ServiceConfig<MapParameters> = supportedServices[service];
      return addMapResource(context, service, serviceConfig, parameters);
    default:
      throw BAD_SERVICE_ERR;
  }
}

/**
 * Entry point for updating existing Geo resource
 * @param context Amplify Core Context object
 * @param service The cloud service that is providing the category
 * @param parameters Parameters used to configure the resource. If not specified, a walkthrough will be launched to populate it.
 */
export async function updateResource(
  context: any,
  service: string
): Promise<string> {
  // load the service config for this service
  const BAD_SERVICE_ERR = new Error(`amplify-category-geo is not configured to provide service type ${service}`);

  switch (service) {
    case ServiceName.Map:
      const serviceConfig: ServiceConfig<MapParameters> = supportedServices[service];
      return updateMapResource(context, service, serviceConfig);
    default:
      throw BAD_SERVICE_ERR;
  }
};

export async function removeResource(
  context: any,
  service: string
): Promise<string> {
  // load the service config for this service
  const BAD_SERVICE_ERR = new Error(`amplify-category-geo is not configured to provide service type ${service}`);

  switch (service) {
    case ServiceName.Map:
      const serviceConfig: ServiceConfig<MapParameters> = supportedServices[service];
      return removeMapResource(context, service);
    default:
      throw BAD_SERVICE_ERR;
  }
};

function checkIfAuthExists(context: $TSContext) {
    const { amplify } = context;
    const { amplifyMeta } = amplify.getProjectDetails();
    let authExists = false;
    const authServiceName = 'Cognito';
    const authCategory = 'auth';

    if (amplifyMeta[authCategory] && Object.keys(amplifyMeta[authCategory]).length > 0) {
      const categoryResources = amplifyMeta[authCategory];
      Object.keys(categoryResources).forEach(resource => {
        if (categoryResources[resource].service === authServiceName) {
          authExists = true;
        }
      });
    }
    return authExists;
}

export async function addMapResource(
  context: $TSContext,
  service: string,
  serviceConfig: ServiceConfig<MapParameters>,
  parameters?: Partial<MapParameters>
): Promise<string> {
  // Go through the walkthrough if the parameters are incomplete map parameters
  let completeParams: MapParameters;
  if (!parameters || !isCompleteMapParams(parameters)) {
    // initialize the Map parameters
    let mapParams: Partial<MapParameters> = {
      providerContext: setProviderContext(context, service)
    };

    // merge in given parameters
    mapParams = merge(mapParams, parameters);

    // populate the parameters for the resource
    // This will modify mapParams
    await serviceConfig.walkthroughs.createWalkthrough(context, mapParams);
    completeParams = convertToCompleteMapParams(mapParams);
  } else {
    completeParams = parameters;
  }

  createMapResource(context, completeParams);

  const { print } = context;
  print.success(`Successfully added resource ${completeParams.mapName} locally.`);
  printNextStepsSuccessMessage(context);
  return completeParams.mapName;
}

function printNextStepsSuccessMessage(context: $TSContext) {
  const { print } = context;
  print.info('');
  print.success('Next steps:');
  print.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
  print.info(
    '"amplify publish" builds all of your local backend and front-end resources (if you added hosting category) and provisions them in the cloud',
  );
}

function setProviderContext(context: $TSContext, service: string): ProviderContext {
  return {
    provider: provider,
    service: service,
    projectName: context.amplify.getProjectDetails().projectConfig.projectName,
  };
}

export async function updateMapResource(
  context: $TSContext,
  service: string,
  serviceConfig: ServiceConfig<MapParameters>
): Promise<string> {
  // initialize the Map parameters
  let mapParams: Partial<MapParameters> = {
    providerContext: setProviderContext(context, service)
  };
  // populate the parameters for the resource
  // This will modify mapParams
  await serviceConfig.walkthroughs.updateWalkthrough(context, mapParams);

  if (mapParams.mapName && mapParams.isDefaultMap !== undefined && mapParams.accessType) {
    modifyMapResource(context, {
      accessType: mapParams.accessType,
      mapName: mapParams.mapName,
      isDefaultMap: mapParams.isDefaultMap
    });
  }
  else throw new Error('Insufficient information to update Map resource.');

  const { print } = context;
  print.success(`Successfully updated resource ${mapParams.mapName} locally.`);
  printNextStepsSuccessMessage(context);
  return mapParams.mapName;
};

export async function removeMapResource(
  context: any,
  service: string
): Promise<string> {
  const { amplify } = context;
  const resourceToRemove = await removeWalkthrough(context, service);
  const resourceParameters = getCurrentMapParameters(context, resourceToRemove);

  // choose another default if removing a default map
  if (resourceParameters.isDefaultMap) {
    await updateDefaultMapWalkthrough(context, resourceToRemove);
  }

  await amplify.removeResource(context, category, resourceToRemove)
    .catch(err => {
      if (err.stack) {
        context.print.info(err.stack);
        context.print.error(`An error occurred when removing the geo resource ${resourceToRemove}`);
      }

      context.usageData.emitError(err);
      process.exitCode = 1;
  });

  printNextStepsSuccessMessage(context);
  return resourceToRemove;
};

export function openConsole(context: any, service: ServiceName) {
  const amplifyMeta = context.amplify.getProjectMeta();
  const region = amplifyMeta.providers[provider].Region;
  let selection: string | undefined;
  switch (service) {
    case ServiceName.Map:
        selection = "maps";
        break;
    default:
        selection = undefined;
  }
  let url: string = `https://${region}.console.aws.amazon.com/location/home?region=${region}#/`;
  if (selection) {
    url = `https://${region}.console.aws.amazon.com/location/${selection}/home?region=${region}#/`;
  }
  open(url, { wait: false });
}
