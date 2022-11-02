import {
  $TSContext, $TSObject, AmplifyCategories, AmplifySupportedService, open, ProviderContext, stateManager,
} from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import { validateAddGeoRequest, validateUpdateGeoRequest } from 'amplify-util-headless-input';
import { TemplateMappings } from '../service-stacks/baseStack';
import { provider, ServiceName } from '../service-utils/constants';
import { checkGeoResourceExists } from '../service-utils/resourceUtils';
import { getServiceFriendlyName } from '../service-walkthroughs/resourceWalkthrough';
import { addGeofenceCollectionResource, removeGeofenceCollectionResource, updateGeofenceCollectionResource } from './geofenceCollection';
import {
  addMapResource, addMapResourceHeadless, removeMapResource, updateMapResource, updateMapResourceHeadless,
} from './map';
import { addPlaceIndexResource, removePlaceIndexResource, updatePlaceIndexResource } from './placeIndex';
import { addDeviceLocationTrackingResource } from './deviceLocationTracking';

/**
 * Entry point for creating a new Geo resource
 */
export const addResource = async (context: $TSContext, service: string): Promise<string | undefined> => {
  if (!projectHasAuth()) {
    if (await prompter.yesOrNo('geo category resources require auth (Amazon Cognito). Do you want to add auth now?')) {
      await context.amplify.invokePluginMethod(context, AmplifyCategories.AUTH, undefined, 'add', [context]);
    } else {
      printer.info('Please add auth (Amazon Cognito) to your project using "amplify add auth"');
      return undefined;
    }
  }

  switch (service) {
    case ServiceName.Map:
      return addMapResource(context);
    case ServiceName.PlaceIndex:
      return addPlaceIndexResource(context);
    case ServiceName.DeviceLocationTracking:
      return addDeviceLocationTrackingResource(context);
    case ServiceName.GeofenceCollection:
      return addGeofenceCollectionResource(context);
    default:
      throw badServiceError(service);
  }
};

/**
 * Entry point for updating existing Geo resource
 */
export const updateResource = async (context: $TSContext, service: string): Promise<string> => {
  switch (service) {
    case ServiceName.Map:
      return updateMapResource(context);
    case ServiceName.PlaceIndex:
      return updatePlaceIndexResource(context);
    case ServiceName.GeofenceCollection:
      return updateGeofenceCollectionResource(context);
    default:
      throw badServiceError(service);
  }
};

/**
 * Entry point for removing existing Geo resource
 */
export const removeResource = async (context: $TSContext, service: string): Promise<string | undefined> => {
  switch (service) {
    case ServiceName.Map:
      return removeMapResource(context);
    case ServiceName.PlaceIndex:
      return removePlaceIndexResource(context);
    case ServiceName.GeofenceCollection:
      return removeGeofenceCollectionResource(context);
    default:
      throw badServiceError(service);
  }
};

/**
 *
 */
export const projectHasAuth = (): boolean => !!Object.values(stateManager.getMeta()?.auth || {})
  .find(meta => (meta as $TSObject)?.service === AmplifySupportedService.COGNITO);

/**
 *
 */
export const printNextStepsSuccessMessage = () => {
  printer.blankLine();
  printer.success('Next steps:');
  printer.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
  printer.info(
    '"amplify publish" builds all of your local backend and front-end resources (if you added hosting category) and provisions them in the cloud',
  );
};

/**
 *
 */
export const setProviderContext = (context: $TSContext, service: string): ProviderContext => ({
  provider,
  service,
  projectName: context.amplify.getProjectDetails().projectConfig.projectName,
});

/**
 *
 */
export const openConsole = (service: string) => {
  const amplifyMeta = stateManager.getMeta();
  const region = amplifyMeta.providers[provider].Region;
  let selection: string | undefined;
  switch (service) {
    case ServiceName.Map:
      selection = 'maps';
      break;
    case ServiceName.PlaceIndex:
      selection = 'places';
      break;
    case ServiceName.GeofenceCollection:
      selection = 'geofencing';
      break;
    default:
      selection = undefined;
  }
  let url = `https://${region}.console.aws.amazon.com/location/home?region=${region}#/`;
  if (selection) {
    url = `https://${region}.console.aws.amazon.com/location/${selection}/home?region=${region}#/`;
  }
  open(url, { wait: false });
};

const badServiceError = (service: string): Error => new Error(`amplify-category-geo is not configured to provide service type ${service}`);

/**
 *
 */
export const insufficientInfoForUpdateError = (service: ServiceName): Error => new Error(`Insufficient information to update ${getServiceFriendlyName(service)}. Please re-try and provide all inputs.`);

/**
 *
 */
export const getTemplateMappings = async (context: $TSContext): Promise<TemplateMappings> => {
  const Mappings: TemplateMappings = {
    RegionMapping: {},
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

/**
 * Entry point for headless command of creating a new Geo resource
 */
export const addResourceHeadless = async (
  context: $TSContext,
  headlessPayload: string,
): Promise<string | undefined> => {
  if (!projectHasAuth()) {
    throw new Error('Please add auth (Amazon Cognito) to your project using "amplify add auth"');
  }
  const { serviceConfiguration } = await validateAddGeoRequest(headlessPayload);
  const { serviceName, name } = serviceConfiguration;
  if (await checkGeoResourceExists(name)) {
    throw new Error(`Geo resource with name '${name}' already exists.`);
  }
  switch (serviceName) {
    case ServiceName.Map:
      return addMapResourceHeadless(context, serviceConfiguration);
    default:
      throw badHeadlessServiceError(serviceName);
  }
};

/**
 * Entry point for headless command of updating an existing Geo resource
 */
export const updateResourceHeadless = async (
  context: $TSContext,
  headlessPayload: string,
): Promise<string | undefined> => {
  const { serviceModification } = await validateUpdateGeoRequest(headlessPayload);
  const { serviceName, name } = serviceModification;
  if (!await checkGeoResourceExists(name)) {
    throw new Error(`Geo resource with name '${name}' does not exist.`);
  }
  switch (serviceName) {
    case ServiceName.Map:
      return updateMapResourceHeadless(context, serviceModification);
    default:
      throw badHeadlessServiceError(serviceName);
  }
};

const badHeadlessServiceError = (service: string): Error => new Error(`Headless mode for service type ${service} is not supported`);
