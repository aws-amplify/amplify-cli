import { $TSContext } from 'amplify-cli-core';
import { v4 as uuid } from 'uuid';
import { merge } from 'lodash';
import {
  prompter, alphanumeric, and, minLength, maxLength, Validator,
} from 'amplify-prompts';
import { DeviceLocationTrackingParameters } from '../service-utils/deviceLocationTrackingParams';
import { AccessType } from '../service-utils/resourceParams';
import { ServiceName } from '../service-utils/constants';
import { resourceAccessWalkthrough } from './resourceWalkthrough';

/**
 * Starting point for CLI walkthrough that creates a device location tracking resource
 * @param context The Amplify Context object
 * @param parameters The configurations of the Device Location Tracking Resource
 */
export const createDeviceLocationTrackingWalkthrough = async (
  context: $TSContext,
  parameters: Partial<DeviceLocationTrackingParameters>,
): Promise<Partial<DeviceLocationTrackingParameters>> => {
  let updatedParameters = { ...parameters };
  // get device location tracker name
  updatedParameters = merge(updatedParameters, await deviceLocationTrackerNameWalkthrough(context));

  // get type of access
  updatedParameters = merge(parameters, await resourceAccessWalkthrough(context, updatedParameters, ServiceName.DeviceLocationTracking));

  // optional advanced walkthrough
  // updatedParameters = merge(parameters, await deviceLocationTrackerAdvancedWalkthrough(context, updatedParameters));

  return updatedParameters;
};

const deviceLocationTrackerNameWalkthrough = async (context: any): Promise<Pick<DeviceLocationTrackingParameters, 'name'>> => {
  const initialTrackerId = uuid().split('-').join('');
  const nameValidationErrMsg = 'Device location tracker name can only use the following characters: a-z 0-9 and should have minimum 1 character and max of 95 characters';
  const uniquenessValidation: Validator = () => true;
  // const uniquenessValidation: Validator = async (input: string) =>
  // await checkDeviceLocationTrackerExists(input) ? `Device location tracker ${input} already exists. Choose another name.` : true;
  const validator = and([
    alphanumeric(nameValidationErrMsg),
    minLength(1, nameValidationErrMsg),
    maxLength(95, nameValidationErrMsg),
    uniquenessValidation,
  ]);
  const trackerNameInput = await prompter.input(
    'Provide a name for the device location tracker:',
    { validate: validator, initial: `tracker${initialTrackerId}` },
  );
  return { name: trackerNameInput };
};

// const deviceLocationTrackerAdvancedWalkthrough = (): void => {

// };

// const deviceLocationTrackerGeofenceLinkingWalkthrough = async (context: $TSContext): Promise<> => {

// };

// const deviceLocationTrackerKMSSettingsWalkthrough = async (context: $TSContext): Promise<> => {

// };

// const deviceLocationTrackerFilteringMethodWalkthrough = async (context: $TSContext): Promise<> => {

// };
