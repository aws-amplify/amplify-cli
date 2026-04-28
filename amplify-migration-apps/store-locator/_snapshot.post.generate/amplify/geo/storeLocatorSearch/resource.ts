import { geostoreLocatorSearch } from './storeLocatorSearch-construct';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export function defineStoreLocatorSearch(backend: Backend) {
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
  const policy = new Policy(storeLocatorSearch, 'gen1AuthPolicy', {
    statements: [
      new PolicyStatement({
        actions: [
          'geo:SearchPlaceIndexForPosition',
          'geo:SearchPlaceIndexForText',
          'geo:SearchPlaceIndexForSuggestions',
          'geo:GetPlace',
        ],
        resources: [
          `arn:aws:geo:${storeLocatorSearchStack.region}:${storeLocatorSearchStack.account}:place-index/storeLocatorSearch-x`,
        ],
      }),
    ],
  });
  backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(policy);
  backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(policy);
  backend.auth.resources.groups['storeLocatorAdmin'].role.attachInlinePolicy(
    policy
  );
  return storeLocatorSearch;
}
