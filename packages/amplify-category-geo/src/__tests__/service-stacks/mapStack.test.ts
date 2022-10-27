import { App } from 'aws-cdk-lib';
import { AccessType } from '../../service-utils/resourceParams';
import { MapStack } from '../../service-stacks/mapStack';

describe('cdk stack creation for map service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates Map policy for Authorized users only access type', async () => {
    const stackProps = {
      accessType: AccessType.AuthorizedUsers,
      RegionMapping: {
        'eu-west-2': {
          locationServiceRegion: 'eu-central-1',
        },
      },
      groupPermissions: ['adminGroup'],
      authResourceName: 'mockAuth',
    };
    const mapStack = new MapStack(new App(), 'MapStack', stackProps);
    expect(mapStack.toCloudFormation()).toMatchSnapshot();
  });

  it('creates Map policy for Authorized and Guest users access type', async () => {
    const stackProps = {
      accessType: AccessType.AuthorizedAndGuestUsers,
      RegionMapping: {
        'eu-west-2': {
          locationServiceRegion: 'eu-central-1',
        },
      },
      groupPermissions: ['adminGroup'],
      authResourceName: 'mockAuth',
    };
    const mapStack = new MapStack(new App(), 'MapStack', stackProps);
    expect(mapStack.toCloudFormation()).toMatchSnapshot();
  });
});
