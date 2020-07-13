import _ from 'lodash';

export const fetchPermissionCategories = permissionMap => {
  return _.keys(permissionMap);
};

export const fetchPermissionResourcesForCategory = (permissionMap, category: string) => {
  return _.keys(_.get(permissionMap, [category]));
};

export const fetchPermissionsForResourceInCategory = (permissionMap, category: string, resourceName: string) => {
  return _.get(permissionMap, [category, resourceName]);
};
