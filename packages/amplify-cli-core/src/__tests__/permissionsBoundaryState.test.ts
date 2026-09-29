import { getPermissionsBoundaryArn, setPermissionsBoundaryArn } from '..';
import { stateManager } from '../state-manager';

jest.mock('../state-manager');

const testEnv = 'testEnv';

const objKey = 'PermissionsBoundaryPolicyArn';

const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;
stateManager_mock.getLocalEnvInfo.mockReturnValue({
  envName: testEnv,
});

const testArn = 'testArn';

const tpi_stub = {
  [testEnv]: {
    awscloudformation: {
      [objKey]: testArn,
    },
  },
};

describe('get permissions boundary arn', () => {
  beforeEach(jest.clearAllMocks);
  it('gets arn from team provider info file', () => {
    stateManager_mock.getTeamProviderInfo.mockReturnValueOnce(tpi_stub);
    expect(getPermissionsBoundaryArn()).toEqual(testArn);
  });

  it('gets arn from preInitTeamProviderInfo', () => {
    // setup
    setPermissionsBoundaryArn(testArn, testEnv, tpi_stub);

    // test
    expect(getPermissionsBoundaryArn()).toEqual(testArn);

    // reset
    setPermissionsBoundaryArn(testArn, testEnv);
  });

  it('returns undefined if no value found', () => {
    expect(getPermissionsBoundaryArn()).toBeUndefined();
  });
});

describe('set permissions boundary arn', () => {
  beforeEach(jest.clearAllMocks);
  it('sets the ARN value in tpi file if specified', () => {
    stateManager_mock.getTeamProviderInfo.mockReturnValueOnce({});
    setPermissionsBoundaryArn(testArn);
    expect(stateManager_mock.setTeamProviderInfo.mock.calls[0][1][testEnv].awscloudformation[objKey]).toEqual(testArn);
  });

  it('sets the ARN for the specified env', () => {
    stateManager_mock.getTeamProviderInfo.mockReturnValueOnce({});
    setPermissionsBoundaryArn(testArn, 'otherenv');
    expect(stateManager_mock.setTeamProviderInfo.mock.calls[0][1].otherenv.awscloudformation[objKey]).toEqual(testArn);
  });

  it('removes the ARN value if not specified', () => {
    stateManager_mock.getTeamProviderInfo.mockReturnValueOnce(tpi_stub);
    setPermissionsBoundaryArn();
    expect(stateManager_mock.setTeamProviderInfo.mock.calls[0][1][testEnv].awscloudformation).toBeDefined();
    expect(stateManager_mock.setTeamProviderInfo.mock.calls[0][1][testEnv].awscloudformation[objKey]).toBeUndefined();
  });

  it('if tpi object specified, sets arn in object and sets global preInitTeamProviderInfo', () => {
    const tpi: Record<string, any> = {};
    setPermissionsBoundaryArn(testArn, undefined, tpi);
    expect(tpi[testEnv].awscloudformation[objKey]).toEqual(testArn);
    expect(getPermissionsBoundaryArn()).toEqual(testArn);
    delete (global as any).preInitTeamProviderInfo;
  });
});
