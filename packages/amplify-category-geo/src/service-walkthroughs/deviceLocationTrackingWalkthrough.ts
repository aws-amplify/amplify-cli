import { $TSContext } from 'amplify-cli-core';
import { v4 as uuid } from 'uuid';
import { merge } from 'lodash';
import {
  printer, prompter, alphanumeric, and, minLength, maxLength, Validator, byValues,
} from 'amplify-prompts';
import { DeviceLocationTrackingParameters } from '../service-utils/deviceLocationTrackingParams';
import { AccessType } from '../service-utils/resourceParams';
import { ServiceName } from '../service-utils/constants';
import { resourceAccessWalkthrough, defaultResourceQuestion, getServiceFriendlyName } from './resourceWalkthrough';
import { getGeoServiceMeta, getGeoResources, updateDefaultResource, checkGeoResourceTypeExists, getGeoResourcesByServiceType, checkGeoResourceExists } from '../service-utils/resourceUtils';
import { deviceLocationTrackingCrudPermissionsMap, deviceLocationTrackingAdvancedSettings, deviceLocationTrackingPositionFilteringTypes } from '../service-utils/deviceLocationTrackingConstants';
import { getCurrentTrackingParameters } from '../service-utils/deviceLocationTrackingUtils';
import {
  defaultPositionFilteringMethodLink, learnMoreCognitoConditionKeysLink, learnMoreCreateGeofenceCollectionsLink,
} from '../constants';

const trackingServiceFriendlyName = getServiceFriendlyName(ServiceName.DeviceLocationTracking);

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
  if (await prompter.yesOrNo('Do you want to configure advanced settings?', false)) {
    updatedParameters = merge(parameters, await deviceLocationTrackerAdvancedWalkthrough(context, updatedParameters));
  }
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
  const uniquenessValidation: Validator = async (input: string) => (await checkGeoResourceExists(input) ? `Device location tracker ${input} already exists. Choose another name.` : true);
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
export const deviceLocationTrackerAdvancedWalkthrough = async (
  context: $TSContext,
  parameters: Partial<DeviceLocationTrackingParameters>,
): Promise<Partial<DeviceLocationTrackingParameters>> => {
  let updatedParameters = { ...parameters };
  updatedParameters.positionFiltering = deviceLocationTrackingPositionFilteringTypes['Time-based'];
  const selectedAdvancedSetting = await prompter.pick<'one', string>(
    `Here are the default advanced settings. Select a setting to edit or continue (Use arrow keys)`,
    [...Object.values(deviceLocationTrackingAdvancedSettings), 'Continue'],
    { returnSize: 'one' },
  );
  switch (selectedAdvancedSetting) {
    // Grant users access to devices other than their own
    case deviceLocationTrackingAdvancedSettings.grantOtherAccess:
      updatedParameters = merge(updatedParameters, await deviceLocationTrackerOtherAccessWalkthrough(updatedParameters));
      break;
    // Link Geofence Collection Question
    case deviceLocationTrackingAdvancedSettings.linkGeofenceCollection:
      updatedParameters = merge(updatedParameters, await deviceLocationTrackerGeofenceLinkingWalkthrough(updatedParameters));
      break;
    // Position filtering method settings
    case deviceLocationTrackingAdvancedSettings.setPositionFilteringMethod:
      updatedParameters = merge(updatedParameters, await deviceLocationTrackerFilteringMethodWalkthrough(updatedParameters));
      break;
    case 'Continue':
      break;
    default:
      printer.error('Invalid advanced setting option selected.');
  }
  return updatedParameters;
};

const deviceLocationTrackerOtherAccessWalkthrough = async (
  parameters: Partial<DeviceLocationTrackingParameters>,
): Promise<Partial<DeviceLocationTrackingParameters>> => {
  const updatedParameters = { ...parameters };
  printer.info(`Users in this group can only access their own device by default. Learn more at ${learnMoreCognitoConditionKeysLink}`);
  const selectedUserGroups = await prompter.pick<'many', string>(
    `Select one or more users groups to give full access to:`,
    ['authenticated', 'guest', ...(updatedParameters.groupPermissions ?? [])],
    { returnSize: 'many', pickAtLeast: 1 },
  );
  updatedParameters.selectedUserGroups = selectedUserGroups;
  return updatedParameters;
};

const deviceLocationTrackerGeofenceLinkingWalkthrough = async (
  parameters: Partial<DeviceLocationTrackingParameters>,
): Promise<Partial<DeviceLocationTrackingParameters>> => {
  const updatedParameters = { ...parameters };

  const isExists = await checkGeoResourceTypeExists(ServiceName.GeofenceCollection);
  if (isExists) {
    if (await prompter.yesOrNo('Do you want to link geofence collection(s) to this tracker?', false)) {
      const defaults = parameters?.linkedGeofenceCollections || [];
      const selectedGeofenceCollections = await prompter.pick<'many', string>(
        `Select the geofence collection(s) you want to link to this tracker`,
        await getGeoResourcesByServiceType(ServiceName.GeofenceCollection),
        { returnSize: 'many', initial: byValues(defaults), pickAtLeast: 1 },
      );
      updatedParameters.linkedGeofenceCollections = selectedGeofenceCollections;
    }
  } else {
    printer.info(`We could not find any geofence collections. Review guide on how to create a geofence collection at ${learnMoreCreateGeofenceCollectionsLink}`);
  }
  return updatedParameters;
};

const deviceLocationTrackerFilteringMethodWalkthrough = async (
  parameters: Partial<DeviceLocationTrackingParameters>,
): Promise<Partial<DeviceLocationTrackingParameters>> => {
  const updatedParameters = { ...parameters };
  printer.info(`The default position filtering method for trackers is Time-based filtering. Learn more at ${defaultPositionFilteringMethodLink}`);
  if (await prompter.yesOrNo('Do you want to set the position filtering method for this tracker?', false)) {
    const selectedFilteringMethod = await prompter.pick<'one', string>(
      `Specify the position filtering method for this device tracker`,
      Object.keys(deviceLocationTrackingPositionFilteringTypes),
      { returnSize: 'one' },
    );
    updatedParameters.positionFiltering = deviceLocationTrackingPositionFilteringTypes[selectedFilteringMethod];
  }
  return updatedParameters;
};

/**
 * updateDeviceLocationTrackerWalkthrough
 */
export const updateDeviceLocationTrackerWalkthrough = async (
  context: $TSContext,
  parameters: Partial<DeviceLocationTrackingParameters>,
  resourceToUpdate?: string,
): Promise<Partial<DeviceLocationTrackingParameters>> => {
  let resourceName = resourceToUpdate;
  let updatedParameters = parameters;
  const trackingResourceNames = await getGeoResources(ServiceName.DeviceLocationTracking);
  if (trackingResourceNames.length === 0) {
    printer.error(`No ${trackingServiceFriendlyName} resource to update. Use "amplify add geo" to create a new ${trackingServiceFriendlyName}.`);
    return updatedParameters;
  }

  if (resourceName) {
    if (!trackingResourceNames.includes(resourceName)) {
      printer.error(`No ${trackingServiceFriendlyName} named ${resourceName} exists in the project.`);
      return updatedParameters;
    }
  } else {
    resourceName = await prompter.pick<'one', string>(`Select the ${trackingServiceFriendlyName} you want to update`, trackingResourceNames);
  }

  updatedParameters.name = resourceName;
  updatedParameters = merge(updatedParameters, await getCurrentTrackingParameters(resourceName!));

  // overwrite the parameters based on user input

  const deviceParams = await deviceLocationTrackerAccessWalkthrough(context, updatedParameters);
  updatedParameters.groupPermissions = deviceParams.groupPermissions;
  updatedParameters.roleAndGroupPermissionsMap = deviceParams.roleAndGroupPermissionsMap;

  // optional advanced walkthrough
  if (await prompter.yesOrNo('Do you want to configure advanced settings?', false)) {
    updatedParameters = merge(parameters, await deviceLocationTrackerAdvancedWalkthrough(context, updatedParameters));
  }

  const otherTrackingResources = trackingResourceNames.filter(trackingResourceName => trackingResourceName !== resourceName);
  // if this is the only device tracker, default cannot be removed
  if (otherTrackingResources.length > 0) {
    const isDefault = await prompter.yesOrNo(defaultResourceQuestion(ServiceName.DeviceLocationTracking), updatedParameters.isDefault);
    // If a device tracker is updated, ask for new default
    if (updatedParameters.isDefault && !isDefault) {
      await updateDefaultDeviceTrackerWalkthrough(context, resourceName!, otherTrackingResources);
    }
    updatedParameters.isDefault = isDefault;
  } else {
    updatedParameters.isDefault = true;
  }
  return updatedParameters;
};

/**
 * Walkthrough to choose a different default device tracker
 * @param context The Amplify Context object
 * @param currentDefault The current default device tracker name
 * @param availableDeviceTrackers The names of available device trackers
 * @returns name of the new default device tracker chosen
 */
export const updateDefaultDeviceTrackerWalkthrough = async (
  context: $TSContext,
  currentDefault: string,
  availableDeviceTrackers?: string[],
): Promise<string> => {
  let trackers = availableDeviceTrackers;
  if (!trackers) {
    trackers = await getGeoResources(ServiceName.DeviceLocationTracking);
  }
  const otherDeviceTrackers = trackers.filter(name => name !== currentDefault);
  if (otherDeviceTrackers?.length > 0) {
    const defaultIndexName = await prompter.pick(`Select the ${trackingServiceFriendlyName} you want to set as default:`, otherDeviceTrackers);
    await updateDefaultResource(context, ServiceName.DeviceLocationTracking, defaultIndexName);
  }
  return currentDefault;
};
