import { geostoreLocatorGeofence } from './storeLocatorGeofence-construct';
import { Backend } from '@aws-amplify/backend';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

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
      branchName,
      isDefault: 'true',
    }
  );

  const policy = new Policy(storeLocatorGeofence, 'gen1AuthPolicy', {
    statements: [
      new PolicyStatement({
        actions: [
          'geo:GetGeofence',
          'geo:PutGeofence',
          'geo:BatchPutGeofence',
          'geo:BatchDeleteGeofence',
          'geo:ListGeofences',
        ],
        resources: [
          `arn:aws:geo:${storeLocatorGeofenceStack.region}:${storeLocatorGeofenceStack.account}:geofence-collection/storeLocatorGeofence-x`,
        ],
      }),
    ],
  });

  backend.auth.resources.groups['storeLocatorAdmin'].role.attachInlinePolicy(
    policy
  );

  return storeLocatorGeofence;
};
