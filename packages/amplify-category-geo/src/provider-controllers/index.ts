import { ProviderContext } from 'amplify-cli-core';
import { ServiceName, provider } from '../service-utils/constants';
import { $TSObject, open, stateManager } from 'amplify-cli-core';
import { $TSContext } from 'amplify-cli-core';
import { addPlaceIndexResource, updatePlaceIndexResource, removePlaceIndexResource } from './placeIndex';
import { addMapResource, updateMapResource, removeMapResource } from './map';

/**
 * Entry point for creating a new Geo resource
 */
export const addResource = async (
  context: $TSContext,
  service: string
): Promise<string | undefined> => {
  const BAD_SERVICE_ERR = new Error(`amplify-category-geo is not configured to provide service type ${service}`);

  if(!projectHasAuth()) {
    if (
      await context.amplify.confirmPrompt(
        'You need to add auth (Amazon Cognito) to your project in order to add geo resources. Do you want to add auth now?',
      )
    ){
      await context.amplify.invokePluginMethod(context, 'auth', undefined, 'add', [context]);
    }
    else {
      context.print.info('Please add auth (Amazon Cognito) to your project using "amplify add auth"');
      return;
    }
  }

  switch (service) {
    case ServiceName.Map:
      return addMapResource(context);
    case ServiceName.PlaceIndex:
      return addPlaceIndexResource(context);
    default:
      throw BAD_SERVICE_ERR;
  }
};

/**
 * Entry point for updating existing Geo resource
 */
export const updateResource = async (
  context: any,
  service: string
): Promise<string> => {
  const BAD_SERVICE_ERR = new Error(`amplify-category-geo is not configured to provide service type ${service}`);

  switch (service) {
    case ServiceName.Map:
      return updateMapResource(context);
    case ServiceName.PlaceIndex:
      return updatePlaceIndexResource(context);
    default:
      throw BAD_SERVICE_ERR;
  }
};

/**
 * Entry point for removing existing Geo resource
 */
export const removeResource = async (
  context: any,
  service: string
): Promise<string | undefined> => {
  const BAD_SERVICE_ERR = new Error(`amplify-category-geo is not configured to provide service type ${service}`);

  switch (service) {
    case ServiceName.Map:
      return removeMapResource(context);
    case ServiceName.PlaceIndex:
      return removePlaceIndexResource(context);
    default:
      throw BAD_SERVICE_ERR;
  }
};

export const projectHasAuth = () => !!Object.values(
  stateManager.getMeta()?.auth || {}
).find(meta => (meta as $TSObject)?.service === 'Cognito');

export const printNextStepsSuccessMessage = (context: $TSContext) => {
  const { print } = context;
  print.info('');
  print.success('Next steps:');
  print.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
  print.info(
    '"amplify publish" builds all of your local backend and front-end resources (if you added hosting category) and provisions them in the cloud',
  );
};

export const setProviderContext = (context: $TSContext, service: string): ProviderContext => {
  return {
    provider: provider,
    service: service,
    projectName: context.amplify.getProjectDetails().projectConfig.projectName,
  };
};

export const openConsole = (service: string) => {
  const amplifyMeta = stateManager.getMeta();
  const region = amplifyMeta.providers[provider].Region;
  let selection: string | undefined;
  switch (service) {
    case ServiceName.Map:
      selection = "maps";
      break;
    case ServiceName.PlaceIndex:
      selection = "places";
      break;
    default:
      selection = undefined;
  }
  let url: string = `https://${region}.console.aws.amazon.com/location/home?region=${region}#/`;
  if (selection) {
    url = `https://${region}.console.aws.amazon.com/location/${selection}/home?region=${region}#/`;
  }
  open(url, { wait: false });
};
