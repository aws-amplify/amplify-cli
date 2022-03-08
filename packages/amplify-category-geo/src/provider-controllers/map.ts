import { createMapResource, modifyMapResource, getCurrentMapParameters } from '../service-utils/mapUtils';
import { removeWalkthrough } from '../service-walkthroughs/removeWalkthrough';
import { category } from '../constants';
import { updateDefaultMapWalkthrough, createMapWalkthrough, updateMapWalkthrough } from '../service-walkthroughs/mapWalkthrough';
import { convertToCompleteMapParams, MapParameters } from '../service-utils/mapParams';
import { $TSAny, $TSContext } from 'amplify-cli-core';
import { printNextStepsSuccessMessage, setProviderContext } from './index';
import { ServiceName } from '../service-utils/constants';
import { printer } from 'amplify-prompts';
import { getMapStyleComponents } from '../service-utils/mapParams';
import { GeoServiceConfiguration, GeoServiceModification, GeoServiceRemoval } from 'amplify-headless-interface';
import { merge } from '../service-utils/resourceUtils';
import { checkGeoResourceExists, updateDefaultResource } from '../service-utils/resourceUtils';

export const addMapResource = async (
  context: $TSContext
): Promise<string> => {
  // initialize the Map parameters
  let mapParams: Partial<MapParameters> = {
      providerContext: setProviderContext(context, ServiceName.Map)
  };
  // populate the parameters for the resource
  await createMapWalkthrough(context, mapParams);
  return await addMapResourceWithParams(context, mapParams)
};

export const updateMapResource = async (
  context: $TSContext
): Promise<string> => {
  // initialize the Map parameters
  let mapParams: Partial<MapParameters> = {
    providerContext: setProviderContext(context, ServiceName.Map)
  };
  // populate the parameters for the resource
  await updateMapWalkthrough(context, mapParams);
  return await updateMapResourceWithParams(context, mapParams);
};

export const removeMapResource = async (
  context: any
): Promise<string | undefined> => {
  const mapToRemove = await removeWalkthrough(context, ServiceName.Map);
  if (!mapToRemove) return;
  return await removeMapResourceWithParams(context, mapToRemove);
};

export const addMapResourceHeadless = async (
  context: $TSContext,
  config: GeoServiceConfiguration
): Promise<string> => {
  // initialize the Map parameters
  let mapParams: Partial<MapParameters> = {
    providerContext: setProviderContext(context, ServiceName.Map),
    name: config.name,
    accessType: config.accessType,
    isDefault: config.setAsDefault,
    ...getMapStyleComponents(config.mapStyle)
  };

  return await addMapResourceWithParams(context, mapParams);
}

export const updateMapResourceHeadless = async (
  context: $TSContext,
  config: GeoServiceModification
): Promise<string> => {
  // initialize the Map parameters
  let mapParams: Partial<MapParameters> = {
    providerContext: setProviderContext(context, ServiceName.Map),
    name: config.name,
    accessType: config.accessType,
    isDefault: config.setAsDefault
  };
  mapParams = merge(mapParams, await getCurrentMapParameters(config.name));
  return await updateMapResourceWithParams(context, mapParams);
}

export const removeMapResourceHeadless = async (
  context: $TSContext,
  config: GeoServiceRemoval
): Promise<string> => {
  return await removeMapResourceWithParams(context, config.name, true, config.newDefaultResourceName);
}

export const addMapResourceWithParams = async (
  context: $TSContext,
  mapParams: Partial<MapParameters>
): Promise<string> => {
  const completeParameters: MapParameters = convertToCompleteMapParams(mapParams);
  await createMapResource(context, completeParameters);
  printer.success(`Successfully added resource ${completeParameters.name} locally.`);
  printNextStepsSuccessMessage(context);
  return completeParameters.name;
}

export const updateMapResourceWithParams = async (
  context: $TSContext,
  mapParams: Partial<MapParameters>
): Promise<string> => {
  const completeParameters: MapParameters = convertToCompleteMapParams(mapParams);
  await modifyMapResource(context, completeParameters);

  printer.success(`Successfully updated resource ${mapParams.name} locally.`);
  printNextStepsSuccessMessage(context);
  return completeParameters.name;
}

export const removeMapResourceWithParams = async (
  context: $TSContext,
  mapToRemove: string,
  isHeadlessCommand: boolean = false,
  newDefaultMap?: string
): Promise<string> => {
  const { amplify } = context;
  const mapParams = await getCurrentMapParameters(mapToRemove);
  try {
    await amplify.removeResource(context, category, mapToRemove, { headless: isHeadlessCommand })
    .then(async (resource: { service: string; resourceName: string } | undefined) => {
      // choose another default if removing a default map
      if (resource?.service === ServiceName.Map && mapParams.isDefault) {
        // select new default map in headless mode
        if (isHeadlessCommand) {
          const remainingMaps = ((await context.amplify.getResourceStatus()).allResources as any[])
            .filter(resource => resource.service === ServiceName.Map)
            .map(resource => resource.resourceName);
          if (remainingMaps.length > 0) {
            // directly update the new default map when provided
            if (newDefaultMap && remainingMaps.includes(newDefaultMap)) {
              await updateDefaultResource(context, ServiceName.Map, newDefaultMap);
            }
            // otherwise select first available map as default
            else {
              if (!newDefaultMap){
                printer.info(`New default map is not defined. Set ${remainingMaps[0]} as default map.`)
              } else if (!remainingMaps.includes(newDefaultMap)) {
                printer.info(`Map ${newDefaultMap} does not exist. Set ${remainingMaps[0]} as default map.`)
              }
              await updateDefaultResource(context, ServiceName.Map, remainingMaps[0]);
            }
          }
        }
        // pop up walkthrough question for new default map in non headless scenario
        else {
          await updateDefaultMapWalkthrough(context, resource.resourceName);
        }
      }
    });
  } catch (err: $TSAny) {
    if (err.stack) {
      printer.error(err.stack);
      printer.error(err.message);
      printer.error(`An error occurred when removing the geo resource ${mapToRemove}`);
    }

    context.usageData.emitError(err);
    process.exitCode = 1;
  }
  printNextStepsSuccessMessage(context);
  return mapToRemove;
}
