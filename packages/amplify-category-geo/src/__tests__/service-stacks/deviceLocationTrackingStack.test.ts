import { App } from '@aws-cdk/core';
import { DeviceLocationTrackingStack } from '../../service-stacks/deviceLocationTrackingStack';

describe('cdk stack creation for device tracker service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not add device tracker policy for empty group permissions', async () => {
    const stackProps = {
      RegionMapping: {
        'eu-west-2': {
          locationServiceRegion: 'eu-central-1',
        },
      },
      groupPermissions: [],
      roleAndGroupPermissionsMap: {},
      authResourceName: 'mockAuthResource123',
    };
    const deviceTrackerStack = new DeviceLocationTrackingStack(new App(), 'DeviceLocationTrackingStack', stackProps);
    expect(deviceTrackerStack.toCloudFormation().Resources.deviceAdminDeviceLocationTrackingPolicy).toBeUndefined();
  });

  it('creates device tracker policy for given group permissions', async () => {
    const stackProps = {
      RegionMapping: {
        'eu-west-2': {
          locationServiceRegion: 'eu-central-1',
        },
      },
      groupPermissions: [],
      roleAndGroupPermissionsMap: {
        deviceAdmin: ['List device positions'],
      },
      authResourceName: 'mockAuthResource123',
    };
    const deviceTrackerStack = new DeviceLocationTrackingStack(new App(), 'DeviceLocationTrackingStack', stackProps);
    const deviceTrackerStackGroupAccessPolicy = deviceTrackerStack.toCloudFormation().Resources.deviceAdminDeviceLocationTrackingPolicy;
    expect(deviceTrackerStackGroupAccessPolicy).toBeDefined();
    const deviceTrackerStackGroupAccessPolicyActions = deviceTrackerStackGroupAccessPolicy.Properties.PolicyDocument.Statement[0].Action;
    // policy actions corresponding to the group permissions specified are added
    expect(deviceTrackerStackGroupAccessPolicyActions).toContain('geo:ListDevicePositions');
  });
});
