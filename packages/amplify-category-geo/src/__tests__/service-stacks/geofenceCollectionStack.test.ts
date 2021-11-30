import { AccessType } from '../../service-utils/resourceParams';
import { GeofenceCollectionStack } from '../../service-stacks/geofenceCollectionStack';
import { App } from '@aws-cdk/core';

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
        authResourceName: 'mockAuthResource123'
    };
    const geofenceCollectionStack = new GeofenceCollectionStack(new App(), 'GeofenceCollectionStack', stackProps);
    expect(geofenceCollectionStack.toCloudFormation()).toMatchSnapshot();
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
            "Read geofence",
            "Create/Update geofence"
          ]
        },
        authResourceName: 'mockAuthResource123'
    };
    const geofenceCollectionStack = new GeofenceCollectionStack(new App(), 'GeofenceCollectionStack', stackProps);
    expect(geofenceCollectionStack.toCloudFormation()).toMatchSnapshot();
  });
});
