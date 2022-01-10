import { createGeofenceCollectionResource, modifyGeofenceCollectionResource, getCurrentGeofenceCollectionParameters } from '../service-utils/geofenceCollectionUtils';
import { removeWalkthrough } from '../service-walkthroughs/removeWalkthrough';
import { category } from '../constants';
import { updateDefaultGeofenceCollectionWalkthrough, createGeofenceCollectionWalkthrough, updateGeofenceCollectionWalkthrough } from '../service-walkthroughs/geofenceCollectionWalkthrough';
import { convertToCompleteGeofenceCollectionParams, GeofenceCollectionParameters } from '../service-utils/geofenceCollectionParams';
import { $TSAny, $TSContext } from 'amplify-cli-core';
import { printNextStepsSuccessMessage, setProviderContext } from './index';
import { ServiceName } from '../service-utils/constants';
import { printer } from 'amplify-prompts';

export const addGeofenceCollectionResource = async (
  context: $TSContext
): Promise<string> => {
  // initialize the Geofence Collection parameters
  let geofenceCollectionParams: Partial<GeofenceCollectionParameters> = {
    providerContext: setProviderContext(context, ServiceName.GeofenceCollection)
  };
  // populate the parameters for the resource
  await createGeofenceCollectionWalkthrough(context, geofenceCollectionParams);
  const completeParameters: GeofenceCollectionParameters = convertToCompleteGeofenceCollectionParams(geofenceCollectionParams);

  await createGeofenceCollectionResource(context, completeParameters);

  printer.success(`Successfully added resource ${completeParameters.name} locally.`);
  printNextStepsSuccessMessage(context);
  return completeParameters.name;
};

export const updateGeofenceCollectionResource = async (
  context: $TSContext
): Promise<string> => {
  let geofenceCollectionParams: Partial<GeofenceCollectionParameters> = {
    providerContext: setProviderContext(context, ServiceName.GeofenceCollection)
  };
  // populate the parameters for the resource
  await updateGeofenceCollectionWalkthrough(context, geofenceCollectionParams);
  const completeParameters: GeofenceCollectionParameters = convertToCompleteGeofenceCollectionParams(geofenceCollectionParams);

  await modifyGeofenceCollectionResource(context, completeParameters);

  printer.success(`Successfully updated resource ${geofenceCollectionParams.name} locally.`);
  printNextStepsSuccessMessage(context);
  return completeParameters.name;
};

export const removeGeofenceCollectionResource = async (
  context: any
): Promise<string | undefined> => {
  const { amplify } = context;
  const resourceToRemove = await removeWalkthrough(context, ServiceName.GeofenceCollection);
  if (!resourceToRemove) return;

  const resourceParameters = await getCurrentGeofenceCollectionParameters(resourceToRemove);

  try {
    const resource = await amplify.removeResource(context, category, resourceToRemove);
    if (resource?.service === ServiceName.GeofenceCollection && resourceParameters.isDefault) {
      // choose another default if removing a default geofence collection
      await updateDefaultGeofenceCollectionWalkthrough(context, resource?.resourceName);
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
