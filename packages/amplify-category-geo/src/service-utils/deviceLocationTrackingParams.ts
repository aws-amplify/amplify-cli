import _ from 'lodash';
import { printer } from 'amplify-prompts';
import { ResourceParameters } from './resourceParams';

/**
 * DeviceLocationTrackingParameters
 */
export type DeviceLocationTrackingParameters = ResourceParameters & {
    groupPermissions: string[];
    roleAndGroupPermissionsMap: Record<string, string[]>;
};

/**
 * isCompleteTrackingParams
 */
export const isCompleteTrackingParams = (
  partial: Partial<DeviceLocationTrackingParameters>,
): partial is DeviceLocationTrackingParameters => {
  printer.info(`params: ${JSON.stringify(partial)}`);
  const requiredFields = ['providerContext', 'name', 'accessType'];
  const missingField = requiredFields.find(field => !_.keys(partial).includes(field));
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
