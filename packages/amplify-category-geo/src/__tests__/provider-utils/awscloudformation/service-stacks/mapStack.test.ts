import { AccessType } from '../../../../provider-utils/awscloudformation/utils/resourceParams';
import { MapStack } from '../../../../provider-utils/awscloudformation/service-stacks/mapStack';

describe('cdk stack creation for map resource', () => {
    const provider = 'awscloudformation';
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates Map policy for Authorized users only access type', async() => {
        const stackProps = {
            accessType: AccessType.AuthorizedUsers
        }
        const mapStack = new MapStack(undefined, 'MapStack', stackProps);
        expect(mapStack.toCloudFormation()).toMatchSnapshot();
    });

    it('creates Map policy for Authorized and Guest users access type', async() => {
        const stackProps = {
            accessType: AccessType.AuthorizedAndGuestUsers
        }
        const mapStack = new MapStack(undefined, 'MapStack', stackProps);
        expect(mapStack.toCloudFormation()).toMatchSnapshot();
    });
});