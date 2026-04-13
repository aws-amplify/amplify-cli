import { geostoreLocatorMap } from './storeLocatorMap-construct';
import { Backend } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const defineStoreLocatorMap = (backend: Backend<any>) => {
  const storeLocatorMapStack = backend.createStack('geostoreLocatorMap');
  const storeLocatorMap = new geostoreLocatorMap(
    storeLocatorMapStack,
    'storeLocatorMap',
    {
      authRoleName: backend.auth.resources.authenticatedUserIamRole.roleName,
      unauthRoleName:
        backend.auth.resources.unauthenticatedUserIamRole.roleName,
      authstorelocator41a9495f41a9495fUserPoolId:
        backend.auth.resources.userPool.userPoolId,
      authuserPoolGroupsstoreLocatorAdminGroupRole:
        backend.auth.resources.groups['storeLocatorAdmin'].role.roleName,
      mapName: 'storeLocatorMap',
      mapStyle: 'geo.storeLocatorMap.Style',
      branchName,
      isDefault: 'true',
    }
  );
  return storeLocatorMap;
};
