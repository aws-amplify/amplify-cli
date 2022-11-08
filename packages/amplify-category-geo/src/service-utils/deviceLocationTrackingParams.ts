import { ResourceParameters } from './resourceParams';

/**
 * DeviceLocationTrackingParameters
 */
export type DeviceLocationTrackingParameters = ResourceParameters & {
  groupPermissions: string[];
  roleAndGroupPermissionsMap: Record<string, string[]>;
  linkedGeofenceCollections?: string[];
  positionFiltering?: string;
  kmsKeyId?: string;
  selectedUserGroups?: string[];
};

/**
 * isCompleteTrackingParams
 */
export const isCompleteTrackingParams = (
  partial: Partial<DeviceLocationTrackingParameters>,
): partial is DeviceLocationTrackingParameters => {
  const requiredFields = ['providerContext', 'name', 'accessType'];
  const missingField = requiredFields.find(field => !Object.keys(partial).includes(field));
  return !missingField;
};

/**
 * convertToCompleteTrackingParams
 */
export const convertToCompleteTrackingParams = (
  partial: Partial<DeviceLocationTrackingParameters>,
): DeviceLocationTrackingParameters => {
  if (isCompleteTrackingParams(partial)) {
    return partial as DeviceLocationTrackingParameters;
  }
  throw new Error('Partial<DeviceLocationTrackingParameters> does not satisfy DeviceLocationTrackingParameters');
};
