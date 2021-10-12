import { ProviderContext } from 'amplify-cli-core';
import { ServiceName, provider } from '../service-utils/constants';
import { $TSObject, open, stateManager } from 'amplify-cli-core';
import { $TSContext } from 'amplify-cli-core';
import { addPlaceIndexResource, updatePlaceIndexResource, removePlaceIndexResource } from './placeIndex';
import { addMapResource, updateMapResource, removeMapResource } from './map';
import { printer, prompter } from 'amplify-prompts';
import { getServiceFriendlyName } from '../service-walkthroughs/resourceWalkthrough';
import { TemplateMappings } from '../service-stacks/baseStack';

/**
 * Entry point for creating a new Geo resource
 */
export const addResource = async (
  context: $TSContext,
  service: string
): Promise<string | undefined> => {
  if(!projectHasAuth()) {
    if (
      await prompter.yesOrNo(
        'geo category resources require auth (Amazon Cognito). Do you want to add auth now?',
      )
    ){
      await context.amplify.invokePluginMethod(context, 'auth', undefined, 'add', [context]);
    }
    else {
      printer.info('Please add auth (Amazon Cognito) to your project using "amplify add auth"');
      return;
    }
  }

  switch (service) {
    case ServiceName.Map:
      return addMapResource(context);
    case ServiceName.PlaceIndex:
      return addPlaceIndexResource(context);
    default:
      throw badServiceError(service);
  }
};

/**
 * Entry point for updating existing Geo resource
 */
export const updateResource = async (
  context: $TSContext,
  service: string
): Promise<string> => {
  switch (service) {
    case ServiceName.Map:
      return updateMapResource(context);
    case ServiceName.PlaceIndex:
      return updatePlaceIndexResource(context);
    default:
      throw badServiceError(service);
  }
};

/**
 * Entry point for removing existing Geo resource
 */
export const removeResource = async (
  context: $TSContext,
  service: string
): Promise<string | undefined> => {
  switch (service) {
    case ServiceName.Map:
      return removeMapResource(context);
    case ServiceName.PlaceIndex:
      return removePlaceIndexResource(context);
    default:
      throw badServiceError(service);
  }
};

export const projectHasAuth = () => !!Object.values(
  stateManager.getMeta()?.auth || {}
).find(meta => (meta as $TSObject)?.service === 'Cognito');

export const printNextStepsSuccessMessage = (context: $TSContext) => {
  printer.blankLine();
  printer.success('Next steps:');
  printer.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
  printer.info(
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

const badServiceError = (service: string) => {
  return new Error(`amplify-category-geo is not configured to provide service type ${service}`);
}

export const insufficientInfoForUpdateError = (service: ServiceName) => {
  new Error(`Insufficient information to update ${getServiceFriendlyName(service)}. Please re-try and provide all inputs.`);
}

export const getTemplateMappings = async (context: $TSContext): Promise<TemplateMappings> => {
  const Mappings: TemplateMappings = {
    RegionMapping: {}
  };
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const providerPlugin = await import(providerPlugins[provider]);
  const regionMapping = providerPlugin.getLocationRegionMapping();
  Object.keys(regionMapping).forEach(region => {
    Mappings.RegionMapping[region] = {
      locationServiceRegion: regionMapping[region],
    };
  });
  return Mappings;
};
