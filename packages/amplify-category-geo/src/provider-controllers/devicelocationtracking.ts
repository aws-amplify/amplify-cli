import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { ServiceName } from '../service-utils/constants';
import { convertToCompleteTrackingParams, DeviceLocationTrackingParameters } from '../service-utils/deviceLocationTrackingParams';
import { createDeviceLocationTrackingResource, getCurrentTrackingParameters } from '../service-utils/deviceLocationTrackingUtils';
import { createDeviceLocationTrackingWalkthrough } from '../service-walkthroughs/deviceLocationTrackingWalkthrough';
import { printNextStepsSuccessMessage, setProviderContext } from './index';
import { removeWalkthrough } from '../service-walkthroughs/removeWalkthrough';
import { category } from '../constants';

/**
 * Add Device Location Tracking resource
 */
export const addDeviceLocationTrackingResource = async (
  context: $TSContext,
): Promise<string> => {
  // initialize the Device Location Tracking parameters
  const trackingParams: Partial<DeviceLocationTrackingParameters> = {
    providerContext: setProviderContext(context, ServiceName.DeviceLocationTracking),
  };
  // populate the parameters for the resource
  await createDeviceLocationTrackingWalkthrough(context, trackingParams);
  const resourceName = await addDeviceLocationTrackingWithParams(context, trackingParams);
  return resourceName;
};

export const addDeviceLocationTrackingWithParams = async (
  context: $TSContext,
  trackingParams: Partial<DeviceLocationTrackingParameters>,
): Promise<string> => {
  const completeParameters: DeviceLocationTrackingParameters = convertToCompleteTrackingParams(trackingParams);
  await createDeviceLocationTrackingResource(context, completeParameters);
  printer.success(`Successfully added resource ${completeParameters.name} locally.`);
  printNextStepsSuccessMessage(context);
  return completeParameters.name;
};

/**
 * Remove Device Location Tracking resource
 */
export const removeDeviceLocationTrackingResource = async (
  context: $TSContext,
): Promise<string | undefined> => {
  const { amplify } = context;
  const resourceToRemove = await removeWalkthrough(context, ServiceName.DeviceLocationTracking);
  if (!resourceToRemove) return undefined;

  const resourceParameters = await getCurrentTrackingParameters(resourceToRemove);

  const resource = await amplify.removeResource(context, category, resourceToRemove);
  if (resource?.service === ServiceName.DeviceLocationTracking && resourceParameters.isDefault) {
    // choose another default if removing a default geofence collection
    // FIXME: needs update walkthrough to be implemented
    // await updateDeviceLocationTrackingWalkthrough(context, resource?.resourceName);
  }
  context.amplify.updateBackendConfigAfterResourceRemove(category, resourceToRemove);

  printNextStepsSuccessMessage(context);
  return resourceToRemove;
};
