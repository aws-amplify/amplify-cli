import { ResourceParameters } from './resourceParams';
import _ from 'lodash';

/**
 * Data structure that represents a Place Index Resource
 */
export type PlaceIndexParameters = ResourceParameters & {
  dataSourceIntendedUse: DataSourceIntendedUse;
  groupPermissions: string[];
};

/**
 * Storage option for search data
 */
export enum DataSourceIntendedUse {
  SingleUse = "SingleUse",
  Storage = "Storage"
}

/**
 * check if all necessary place index configuration parameters are available
 */
export const isCompletePlaceIndexParams = (partial: Partial<PlaceIndexParameters>): partial is PlaceIndexParameters => {
  const requiredFields = ['providerContext', 'name', 'dataSourceIntendedUse', 'dataProvider', 'accessType', 'isDefault'];
  const missingField = requiredFields.find(field => !_.keys(partial).includes(field));
  return !missingField;
};

export const convertToCompletePlaceIndexParams = (partial: Partial<PlaceIndexParameters>): PlaceIndexParameters => {
  if (isCompletePlaceIndexParams(partial)) {
      return partial as PlaceIndexParameters;
  }
  throw new Error('Partial<PlaceIndexParameters> does not satisfy PlaceIndexParameters');
};
