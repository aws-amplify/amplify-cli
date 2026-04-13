import { geostoreLocatorGeofence } from './storeLocatorGeofence-construct';
import { Backend } from '@aws-amplify/backend';

const 38b5101cfb.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';

export const defineStoreLocatorGeofence = (backend: Backend<any>) => {
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
      38b5101cfb.deploymentTypeName,
      isDefault: 'true',
    }
  );
  return storeLocatorGeofence;
};
