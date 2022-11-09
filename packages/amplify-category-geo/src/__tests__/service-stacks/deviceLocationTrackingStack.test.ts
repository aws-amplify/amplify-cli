import { App } from '@aws-cdk/core';
import { DeviceLocationTrackingStack } from '../../service-stacks/deviceLocationTrackingStack';
import { provider, ServiceName } from '../../service-utils/constants';
import { DeviceLocationTrackingParameters } from '../../service-utils/deviceLocationTrackingParams';
import { AccessType, DataProvider } from '../../service-utils/resourceParams';

describe('cdk stack creation for device tracker service', () => {
  const mockDeviceTrackerParameters: DeviceLocationTrackingParameters = {
    providerContext: {
      provider,
      service: ServiceName.DeviceLocationTracking,
      projectName: 'mockProject',
    },
    name: 'test',
    dataProvider: DataProvider.Esri,
    accessType: AccessType.AuthorizedAndGuestUsers,
    isDefault: false,
    groupPermissions: [],
    roleAndGroupPermissionsMap: {},
  };
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
      providerContext: mockDeviceTrackerParameters.providerContext,
      name: 'test',
      accessType: AccessType.AuthorizedAndGuestUsers,
      isDefault: false,
      dataProvider: mockDeviceTrackerParameters.dataProvider,
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
      providerContext: mockDeviceTrackerParameters.providerContext,
      name: 'test',
      accessType: AccessType.AuthorizedAndGuestUsers,
      isDefault: false,
      dataProvider: mockDeviceTrackerParameters.dataProvider,
    };
    const deviceTrackerStack = new DeviceLocationTrackingStack(new App(), 'DeviceLocationTrackingStack', stackProps);
    const deviceTrackerStackGroupAccessPolicy = deviceTrackerStack.toCloudFormation().Resources.deviceAdminDeviceLocationTrackingPolicy;
    expect(deviceTrackerStackGroupAccessPolicy).toBeDefined();
    const deviceTrackerStackGroupAccessPolicyActions = deviceTrackerStackGroupAccessPolicy.Properties.PolicyDocument.Statement[0].Action;
    // policy actions corresponding to the group permissions specified are added
    expect(deviceTrackerStackGroupAccessPolicyActions).toContain('geo:ListDevicePositions');
  });
});
