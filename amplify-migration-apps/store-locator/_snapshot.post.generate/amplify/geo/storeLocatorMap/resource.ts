import { geostoreLocatorMap } from './storeLocatorMap-construct';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export function defineStoreLocatorMap(backend: Backend) {
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
  const policy = new Policy(storeLocatorMap, 'gen1AuthPolicy', {
    statements: [
      new PolicyStatement({
        actions: [
          'geo:GetMapStyleDescriptor',
          'geo:GetMapGlyphs',
          'geo:GetMapSprites',
          'geo:GetMapTile',
        ],
        resources: [
          `arn:aws:geo:${storeLocatorMapStack.region}:${storeLocatorMapStack.account}:map/storeLocatorMap-x`,
        ],
      }),
    ],
  });
  backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(policy);
  backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(policy);
  backend.auth.resources.groups['storeLocatorAdmin'].role.attachInlinePolicy(
    policy
  );
  return storeLocatorMap;
}
