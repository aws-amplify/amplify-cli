import { $TSContext } from 'amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { GeoServiceConfiguration, GeoServiceModification } from 'amplify-headless-interface';
import { createMapResource, modifyMapResource, getCurrentMapParameters } from '../service-utils/mapUtils';
import { removeWalkthrough } from '../service-walkthroughs/removeWalkthrough';
import { category } from '../constants';
import { updateDefaultMapWalkthrough, createMapWalkthrough, updateMapWalkthrough } from '../service-walkthroughs/mapWalkthrough';
import { convertToCompleteMapParams, MapParameters } from '../service-utils/mapParams';
import { printNextStepsSuccessMessage, setProviderContext } from './index';
import { ServiceName } from '../service-utils/constants';
import { getMapStyleComponents } from '../service-utils/mapParams';
import { merge } from '../service-utils/resourceUtils';

export const addMapResource = async (context: $TSContext): Promise<string> => {
  // initialize the Map parameters
  const mapParams: Partial<MapParameters> = {
    providerContext: setProviderContext(context, ServiceName.Map),
  };
  // populate the parameters for the resource
  await createMapWalkthrough(context, mapParams);
  return addMapResourceWithParams(context, mapParams);
};

export const updateMapResource = async (context: $TSContext): Promise<string> => {
  // initialize the Map parameters
  const mapParams: Partial<MapParameters> = {
    providerContext: setProviderContext(context, ServiceName.Map),
  };
  // populate the parameters for the resource
  await updateMapWalkthrough(context, mapParams);
  return updateMapResourceWithParams(context, mapParams);
};

export const removeMapResource = async (context: $TSContext): Promise<string | undefined> => {
  const { amplify } = context;
  const resourceToRemove = await removeWalkthrough(ServiceName.Map);
  if (!resourceToRemove) return undefined;

  const resourceParameters = await getCurrentMapParameters(resourceToRemove);

  const resource = await amplify.removeResource(context, category, resourceToRemove);
  if (resource?.service === ServiceName.Map && resourceParameters.isDefault) {
    // choose another default if removing a default map
    await updateDefaultMapWalkthrough(context, resource?.resourceName);
  }

  context.amplify.updateBackendConfigAfterResourceRemove(category, resourceToRemove);

  printNextStepsSuccessMessage();
  return resourceToRemove;
};

export const addMapResourceHeadless = async (context: $TSContext, config: GeoServiceConfiguration): Promise<string> => {
  // initialize the Map parameters
  const mapParams: Partial<MapParameters> = {
    providerContext: setProviderContext(context, ServiceName.Map),
    name: config.name,
    accessType: config.accessType,
    isDefault: config.setAsDefault,
    ...getMapStyleComponents(config.mapStyle),
  };

  return addMapResourceWithParams(context, mapParams);
};

export const updateMapResourceHeadless = async (context: $TSContext, config: GeoServiceModification): Promise<string> => {
  // initialize the Map parameters
  let mapParams: Partial<MapParameters> = {
    providerContext: setProviderContext(context, ServiceName.Map),
    name: config.name,
    accessType: config.accessType,
    isDefault: config.setAsDefault,
  };
  mapParams = merge(mapParams, await getCurrentMapParameters(config.name));
  return updateMapResourceWithParams(context, mapParams);
};

export const addMapResourceWithParams = async (context: $TSContext, mapParams: Partial<MapParameters>): Promise<string> => {
  const completeParameters: MapParameters = convertToCompleteMapParams(mapParams);
  await createMapResource(context, completeParameters);
  printer.success(`Successfully added resource ${completeParameters.name} locally.`);
  printNextStepsSuccessMessage();
  return completeParameters.name;
};

export const updateMapResourceWithParams = async (context: $TSContext, mapParams: Partial<MapParameters>): Promise<string> => {
  const completeParameters: MapParameters = convertToCompleteMapParams(mapParams);

  await modifyMapResource(context, completeParameters);

  printer.success(`Successfully updated resource ${mapParams.name} locally.`);
  printNextStepsSuccessMessage();
  return completeParameters.name;
};
