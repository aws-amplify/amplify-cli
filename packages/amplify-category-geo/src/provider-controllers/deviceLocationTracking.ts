import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { ServiceName } from '../service-utils/constants';
import { convertToCompleteTrackingParams, DeviceLocationTrackingParameters } from '../service-utils/deviceLocationTrackingParams';
import { createDeviceLocationTrackingResource } from '../service-utils/deviceLocationTrackingUtils';
import { createDeviceLocationTrackingWalkthrough } from '../service-walkthroughs/deviceLocationTrackingWalkthrough';
import { printNextStepsSuccessMessage, setProviderContext } from './index';

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

/**
 * addDeviceLocationTrackingWithParams
 */
export const addDeviceLocationTrackingWithParams = async (
  context: $TSContext,
  trackingParams: Partial<DeviceLocationTrackingParameters>,
): Promise<string> => {
  const completeParameters: DeviceLocationTrackingParameters = convertToCompleteTrackingParams(trackingParams);
  await createDeviceLocationTrackingResource(context, completeParameters);
  printer.success(`Successfully added resource ${completeParameters.name} locally.`);
  printNextStepsSuccessMessage();
  return completeParameters.name;
};
