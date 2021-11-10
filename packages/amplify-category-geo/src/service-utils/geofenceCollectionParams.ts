import { ResourceParameters } from './resourceParams';
import _ from 'lodash';
import { $TSObject } from 'amplify-cli-core';

/**
 * Data structure that represents a Geofence Collection Resource
 */
export type GeofenceCollectionParameters = ResourceParameters & {
    groupPermissions: $TSObject
};

/**
 * check if all necessary geofence collection configuration parameters are available
 */
export const isCompleteGeofenceCollectionParams = (partial: Partial<GeofenceCollectionParameters>): partial is GeofenceCollectionParameters => {
    const requiredFields = ['providerContext', 'name', 'dataProvider', 'accessType', 'isDefault'];
    const missingField = requiredFields.find(field => !_.keys(partial).includes(field));
    return !missingField;
};

export const convertToCompleteGeofenceCollectionParams = (partial: Partial<GeofenceCollectionParameters>): GeofenceCollectionParameters => {
    if (isCompleteGeofenceCollectionParams(partial)) {
        return partial as GeofenceCollectionParameters;
    }
    throw new Error('Partial<GeofenceCollectionParameters> does not satisfy GeofenceCollectionParameters');
};
