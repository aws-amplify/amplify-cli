import { $TSContext } from 'amplify-cli-core';
import { v4 as uuid } from 'uuid';
import { merge } from 'lodash';
import {
  prompter, alphanumeric, and, minLength, maxLength, Validator, byValues,
} from 'amplify-prompts';
import { DeviceLocationTrackingParameters } from '../service-utils/deviceLocationTrackingParams';
import { AccessType } from '../service-utils/resourceParams';
import { ServiceName } from '../service-utils/constants';
import { resourceAccessWalkthrough, defaultResourceQuestion } from './resourceWalkthrough';
import { getGeoServiceMeta } from '../service-utils/resourceUtils';
import { deviceLocationTrackingCrudPermissionsMap } from '../service-utils/deviceLocationTrackingConstants';

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
  updatedParameters = merge(updatedParameters, await deviceLocationTrackerNameWalkthrough());

  // get type of access
  updatedParameters = merge(parameters, await deviceLocationTrackerAccessWalkthrough(context, updatedParameters));

  // optional advanced walkthrough
  // updatedParameters = merge(parameters, await deviceLocationTrackerAdvancedWalkthrough(context, updatedParameters));

  const currentDeviceLocationTrackerResources = await getGeoServiceMeta(ServiceName.DeviceLocationTracking);
  if (currentDeviceLocationTrackerResources && Object.keys(currentDeviceLocationTrackerResources).length > 0) {
    updatedParameters.isDefault = await prompter.yesOrNo(
      defaultResourceQuestion(ServiceName.DeviceLocationTracking),
      true,
    );
  } else {
    updatedParameters.isDefault = true;
  }

  return updatedParameters;
};

const deviceLocationTrackerNameWalkthrough = async (): Promise<Pick<DeviceLocationTrackingParameters, 'name'>> => {
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

/**
 * deviceLocationTrackerAccessWalkthrough
 */
export const deviceLocationTrackerAccessWalkthrough = async (
  context: $TSContext,
  parameters: Partial<DeviceLocationTrackingParameters>,
): Promise<Partial<DeviceLocationTrackingParameters>> => {
  const updatedParameters = { ...parameters };
  updatedParameters.accessType = AccessType.CognitoGroups;

  const resourceAccessParams = await resourceAccessWalkthrough(context, updatedParameters, ServiceName.DeviceLocationTracking);

  const selectedGroups = [];

  if (resourceAccessParams.accessType === AccessType.AuthorizedAndGuestUsers) {
    selectedGroups.push('authenticated', 'guest');
  } else if (resourceAccessParams.accessType === AccessType.AuthorizedUsers) {
    selectedGroups.push('authenticated');
  }

  if (resourceAccessParams.groupPermissions && resourceAccessParams.groupPermissions.length > 0) {
    selectedGroups.push(...resourceAccessParams.groupPermissions);
  }

  // Flow for asking what permissions to apply for each cognito role or group
  const groupCrudPermissionsFlow = async (group: string, defaults: string[] = []): Promise<string[]> => {
    const selectedCrudPermissions = await prompter.pick<'many', string>(
      `What kind of access do you want for ${group} users? Select ALL that apply:`,
      Object.keys(deviceLocationTrackingCrudPermissionsMap),
      { returnSize: 'many', initial: byValues(defaults), pickAtLeast: 1 },
    );
    return selectedCrudPermissions;
  };

  const selectedGroupPermissions: Record<string, string[]> = {};

  // Creates a mapping of authRole, unauthRole, and any selected groups to the selected crud permissions
  for (const selectedUserPoolGroup of selectedGroups) {
    const defaults = parameters?.roleAndGroupPermissionsMap?.[selectedUserPoolGroup] || [];

    const selectedCrudPermissions = await groupCrudPermissionsFlow(selectedUserPoolGroup, defaults);

    selectedGroupPermissions[selectedUserPoolGroup] = selectedCrudPermissions;
  }

  updatedParameters.groupPermissions = resourceAccessParams.groupPermissions;
  updatedParameters.roleAndGroupPermissionsMap = selectedGroupPermissions;
  return updatedParameters;
};
