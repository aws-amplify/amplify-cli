import { geostoreLocatorSearch } from './storeLocatorSearch-construct';
import { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const defineStoreLocatorSearch = (backend: Backend) => {
  const storeLocatorSearchStack = backend.createStack('geostoreLocatorSearch');
  const storeLocatorSearch = new geostoreLocatorSearch(
    storeLocatorSearchStack,
    'storeLocatorSearch',
    {
      authRoleName: backend.auth.resources.authenticatedUserIamRole.roleName,
      unauthRoleName:
        backend.auth.resources.unauthenticatedUserIamRole.roleName,
      authstorelocator41a9495f41a9495fUserPoolId:
        backend.auth.resources.userPool.userPoolId,
      authuserPoolGroupsstoreLocatorAdminGroupRole:
        backend.auth.resources.groups['storeLocatorAdmin'].role.roleName,
      indexName: 'storeLocatorSearch',
      dataProvider: 'Here',
      dataSourceIntendedUse: 'SingleUse',
      branchName,
      isDefault: 'true',
    }
  );
  return storeLocatorSearch;
};
