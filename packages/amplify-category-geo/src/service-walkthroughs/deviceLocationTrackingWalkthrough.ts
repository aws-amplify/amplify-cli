import { $TSContext } from 'amplify-cli-core';
import { v4 as uuid } from 'uuid';
import { merge } from 'lodash';
import {
  prompter, alphanumeric, and, minLength, maxLength, Validator, byValues, printer,
} from 'amplify-prompts';
import { DeviceLocationTrackingParameters } from '../service-utils/deviceLocationTrackingParams';
import { AccessType } from '../service-utils/resourceParams';
import { ServiceName } from '../service-utils/constants';
import { resourceAccessWalkthrough, defaultResourceQuestion } from './resourceWalkthrough';
import { getGeoServiceMeta } from '../service-utils/resourceUtils';
import { deviceLocationTrackingAdvancedSettings, deviceLocationTrackingCrudPermissionsMap, deviceLocationTrackingPositionFilteringTypes } from '../service-utils/deviceLocationTrackingConstants';

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
  updatedParameters = merge(parameters, await deviceLocationTrackerAdvancedWalkthrough(context, updatedParameters));

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

/**
 * deviceLocationTrackerAdvancedWalkthrough
 */
const deviceLocationTrackerAdvancedWalkthrough = async (
  context: $TSContext,
  parameters: Partial<DeviceLocationTrackingParameters>,
): Promise<Partial<DeviceLocationTrackingParameters>> => {
  let updatedParameters = { ...parameters };
  const selectedAdvancedSetting = await prompter.pick<'one', string>(
    `Here are the default advanced settings. Select a setting to edit or continue (Use arrow keys)`,
    Object.values(deviceLocationTrackingAdvancedSettings),
    { returnSize: 'one' },
  );
  switch (selectedAdvancedSetting) {
    // Grant users access to devices other than their own
    case deviceLocationTrackingAdvancedSettings.grantOtherAccess:
      // updatedParameters = merge(updatedParameters, await deviceLocationTrackerOtherAccessWalkthrough(updatedParameters));
      break;
    // Link Geofence Collection Question
    case deviceLocationTrackingAdvancedSettings.linkGeofenceCollection:
      // updatedParameters = merge(updatedParameters, await deviceLocationTrackerGeofenceLinkingWalkthrough(updatedParameters));
      break;
    // KMS Settings
    case deviceLocationTrackingAdvancedSettings.addKMSSettings:
      // updatedParameters = merge(updatedParameters, await deviceLocationTrackerKMSSettingsWalkthrough(updatedParameters));
      break;
    // Position filtering method settings
    case deviceLocationTrackingAdvancedSettings.setPositionFilteringMethod:
      updatedParameters = merge(updatedParameters, await deviceLocationTrackerFilteringMethodWalkthrough(updatedParameters));
      break;
    default:
      printer.error('something went wrong...');
  }
  return updatedParameters;
};

// const deviceLocationTrackerOtherAccessWalkthrough = async (parameters: Partial<DeviceLocationTrackingParameters>): Promise<> => {
// };

// const deviceLocationTrackerGeofenceLinkingWalkthrough = async (parameters: Partial<DeviceLocationTrackingParameters>): Promise<> => {
// };

// const deviceLocationTrackerKMSSettingsWalkthrough = async (parameters: Partial<DeviceLocationTrackingParameters>): Promise<> => {
// };

const deviceLocationTrackerFilteringMethodWalkthrough = async (
  parameters: Partial<DeviceLocationTrackingParameters>,
): Promise<Partial<DeviceLocationTrackingParameters>> => {
  const updatedParameters = { ...parameters };
  printer.info('The default position filtering method for trackers is Accuracy-based filtering. Learn more at');
  if (await prompter.yesOrNo('Do you want to set the position filtering method for this tracker?', false)) {
    const selectedFilteringMethod = await prompter.pick<'one', string>(
      `Specify the data provider of geospatial data for this search index`,
      Object.keys(deviceLocationTrackingPositionFilteringTypes),
      { returnSize: 'one' },
    );
    updatedParameters.positionFiltering = deviceLocationTrackingPositionFilteringTypes[selectedFilteringMethod];
  }
  return updatedParameters;
};
