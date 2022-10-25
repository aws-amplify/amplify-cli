import { App } from 'aws-cdk-lib';
import { AccessType } from '../../service-utils/resourceParams';
import { GeofenceCollectionStack } from '../../service-stacks/geofenceCollectionStack';

describe('cdk stack creation for geofence collection service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not add geofence collection policy for empty group permissions', async () => {
    const stackProps = {
      accessType: AccessType.AuthorizedUsers,
      RegionMapping: {
        'eu-west-2': {
          locationServiceRegion: 'eu-central-1',
        },
      },
      groupPermissions: {},
      authResourceName: 'mockAuthResource123',
    };
    const geofenceCollectionStack = new GeofenceCollectionStack(new App(), 'GeofenceCollectionStack', stackProps);
    expect(geofenceCollectionStack.toCloudFormation().Resources.collectionsAdminGeofenceCollectionPolicy).toBeUndefined();
  });

  it('creates geofence collection policy for given group permissions', async () => {
    const stackProps = {
      accessType: AccessType.AuthorizedUsers,
      RegionMapping: {
        'eu-west-2': {
          locationServiceRegion: 'eu-central-1',
        },
      },
      groupPermissions: {
        collectionsAdmin: [
          'Read geofence',
          'Create/Update geofence',
        ],
      },
      authResourceName: 'mockAuthResource123',
    };
    const geofenceCollectionStack = new GeofenceCollectionStack(new App(), 'GeofenceCollectionStack', stackProps);
    const geofenceCollectionStackGroupAccessPolicy = geofenceCollectionStack.toCloudFormation()
      .Resources.collectionsAdminGeofenceCollectionPolicy;
    expect(geofenceCollectionStackGroupAccessPolicy).toBeDefined();
    const geofenceCollectionStackGroupAccessPolicyActions = geofenceCollectionStackGroupAccessPolicy
      .Properties.PolicyDocument.Statement[0].Action;
    // policy actions corresponding to the group permissions specified are added
    expect(geofenceCollectionStackGroupAccessPolicyActions).toContain('geo:GetGeofence');
    expect(geofenceCollectionStackGroupAccessPolicyActions).toContain('geo:PutGeofence');
    expect(geofenceCollectionStackGroupAccessPolicyActions).toContain('geo:BatchPutGeofence');
  });
});
