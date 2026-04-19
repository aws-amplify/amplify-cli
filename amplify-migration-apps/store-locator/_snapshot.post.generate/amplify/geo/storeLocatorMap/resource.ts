import { geostoreLocatorMap } from './storeLocatorMap-construct';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const defineStoreLocatorMap = (backend: Backend) => {
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
      mapStyle: 'VectorEsriStreets',
      branchName,
      isDefault: 'true',
    }
  );
  return storeLocatorMap;
};
