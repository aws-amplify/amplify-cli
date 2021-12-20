import { createMapResource, modifyMapResource, getCurrentMapParameters } from '../service-utils/mapUtils';
import { removeWalkthrough } from '../service-walkthroughs/removeWalkthrough';
import { category } from '../constants';
import { updateDefaultMapWalkthrough, createMapWalkthrough, updateMapWalkthrough } from '../service-walkthroughs/mapWalkthrough';
import { convertToCompleteMapParams, MapParameters } from '../service-utils/mapParams';
import { $TSAny, $TSContext } from 'amplify-cli-core';
import { printNextStepsSuccessMessage, setProviderContext, insufficientInfoForUpdateError } from './index';
import { ServiceName } from '../service-utils/constants';
import { printer } from 'amplify-prompts';
import { getMapStyleComponents } from '../service-utils/mapParams';
import { MapConfiguration, MapModification } from 'amplify-headless-interface';

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
  const { amplify } = context;
  const resourceToRemove = await removeWalkthrough(context, ServiceName.Map);
  if (!resourceToRemove) return;

  const resourceParameters = await getCurrentMapParameters(resourceToRemove);

  try {
    const resource = await amplify.removeResource(context, category, resourceToRemove);
    if (resource?.service === ServiceName.Map && resourceParameters.isDefault) {
      // choose another default if removing a default map
      await updateDefaultMapWalkthrough(context, resource?.resourceName);
    }
  } catch (err: $TSAny) {
    if (err.stack) {
      printer.error(err.stack);
      printer.error(err.message);
      printer.error(`An error occurred when removing the geo resource ${resourceToRemove}`);
    }

    context.usageData.emitError(err);
    process.exitCode = 1;
  }

  printNextStepsSuccessMessage(context);
  return resourceToRemove;
};

export const addMapResourceHeadless = async (
  context: $TSContext,
  config: MapConfiguration
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
  config: MapModification
): Promise<string> => {
  // initialize the Map parameters
  let mapParams: Partial<MapParameters> = {
    providerContext: setProviderContext(context, ServiceName.Map),
    name: config.name,
    accessType: config.accessType,
    isDefault: config.setAsDefault,
  };
  return await updateMapResourceWithParams(context, mapParams);
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
