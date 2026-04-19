import { geostoreLocatorGeofence } from './storeLocatorGeofence-construct';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const defineStoreLocatorGeofence = (backend: Backend) => {
  const storeLocatorGeofenceStack = backend.createStack(
    'geostoreLocatorGeofence'
  );
  const storeLocatorGeofence = new geostoreLocatorGeofence(
    storeLocatorGeofenceStack,
    'storeLocatorGeofence',
    {
      authstorelocator41a9495f41a9495fUserPoolId:
        backend.auth.resources.userPool.userPoolId,
      authuserPoolGroupsstoreLocatorAdminGroupRole:
        backend.auth.resources.groups['storeLocatorAdmin'].role.roleName,
      collectionName: 'storeLocatorGeofence',
      branchName,
      isDefault: 'true',
    }
  );
  return storeLocatorGeofence;
};
