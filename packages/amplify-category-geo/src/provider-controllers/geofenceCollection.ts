import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { category } from '../constants';
import { ServiceName } from '../service-utils/constants';
import { convertToCompleteGeofenceCollectionParams, GeofenceCollectionParameters } from '../service-utils/geofenceCollectionParams';
import {
  createGeofenceCollectionResource,
  getCurrentGeofenceCollectionParameters,
  modifyGeofenceCollectionResource,
} from '../service-utils/geofenceCollectionUtils';
import {
  createGeofenceCollectionWalkthrough,
  updateDefaultGeofenceCollectionWalkthrough,
  updateGeofenceCollectionWalkthrough,
} from '../service-walkthroughs/geofenceCollectionWalkthrough';
import { removeWalkthrough } from '../service-walkthroughs/removeWalkthrough';
import { printNextStepsSuccessMessage, setProviderContext } from './index';

export const addGeofenceCollectionResource = async (context: $TSContext): Promise<string> => {
  // initialize the Geofence Collection parameters
  const geofenceCollectionParams: Partial<GeofenceCollectionParameters> = {
    providerContext: setProviderContext(context, ServiceName.GeofenceCollection),
  };
  // populate the parameters for the resource
  await createGeofenceCollectionWalkthrough(context, geofenceCollectionParams);
  const completeParameters: GeofenceCollectionParameters = convertToCompleteGeofenceCollectionParams(geofenceCollectionParams);

  await createGeofenceCollectionResource(context, completeParameters);

  printer.success(`Successfully added resource ${completeParameters.name} locally.`);
  printNextStepsSuccessMessage();
  return completeParameters.name;
};

export const updateGeofenceCollectionResource = async (context: $TSContext): Promise<string> => {
  const geofenceCollectionParams: Partial<GeofenceCollectionParameters> = {
    providerContext: setProviderContext(context, ServiceName.GeofenceCollection),
  };
  // populate the parameters for the resource
  await updateGeofenceCollectionWalkthrough(context, geofenceCollectionParams);
  const completeParameters: GeofenceCollectionParameters = convertToCompleteGeofenceCollectionParams(geofenceCollectionParams);

  await modifyGeofenceCollectionResource(context, completeParameters);

  printer.success(`Successfully updated resource ${geofenceCollectionParams.name} locally.`);
  printNextStepsSuccessMessage();
  return completeParameters.name;
};

export const removeGeofenceCollectionResource = async (context: $TSContext): Promise<string | undefined> => {
  const { amplify } = context;
  const resourceToRemove = await removeWalkthrough(ServiceName.GeofenceCollection);
  if (!resourceToRemove) return undefined;

  const resourceParameters = await getCurrentGeofenceCollectionParameters(resourceToRemove);

  const resource = await amplify.removeResource(context, category, resourceToRemove);
  if (resource?.service === ServiceName.GeofenceCollection && resourceParameters.isDefault) {
    // choose another default if removing a default geofence collection
    await updateDefaultGeofenceCollectionWalkthrough(context, resource?.resourceName);
  }
  context.amplify.updateBackendConfigAfterResourceRemove(category, resourceToRemove);

  printNextStepsSuccessMessage();
  return resourceToRemove;
};
