import { getPermissionBoundaryArn, setPermissionBoundaryArn } from '..';
import { stateManager } from '../state-manager';

jest.mock('../state-manager');

const testEnv = 'testEnv';

const objKey = 'PermissionBoundaryPolicyArn';

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

describe('get permission boundary arn', () => {
  beforeEach(jest.clearAllMocks);
  it('gets arn from team provider info file', () => {
    stateManager_mock.getTeamProviderInfo.mockReturnValueOnce(tpi_stub);
    expect(getPermissionBoundaryArn()).toEqual(testArn);
  });

  it('gets arn from preInitTeamProviderInfo', () => {
    // setup
    setPermissionBoundaryArn(testArn, testEnv, tpi_stub);

    // test
    expect(getPermissionBoundaryArn()).toEqual(testArn);

    // reset
    setPermissionBoundaryArn(testArn, testEnv);
  });

  it('returns undefined if no value found', () => {
    expect(getPermissionBoundaryArn()).toBeUndefined();
  });
});

describe('set permission boundary arn', () => {
  beforeEach(jest.clearAllMocks);
  it('sets the ARN value in tpi file if specified', () => {
    stateManager_mock.getTeamProviderInfo.mockReturnValueOnce({});
    setPermissionBoundaryArn(testArn);
    expect(stateManager_mock.setTeamProviderInfo.mock.calls[0][1][testEnv].awscloudformation[objKey]).toEqual(testArn);
  });

  it('sets the ARN for the specified env', () => {
    stateManager_mock.getTeamProviderInfo.mockReturnValueOnce({});
    setPermissionBoundaryArn(testArn, 'otherenv');
    expect(stateManager_mock.setTeamProviderInfo.mock.calls[0][1].otherenv.awscloudformation[objKey]).toEqual(testArn);
  });

  it('removes the ARN value if not specified', () => {
    stateManager_mock.getTeamProviderInfo.mockReturnValueOnce(tpi_stub);
    setPermissionBoundaryArn();
    expect(stateManager_mock.setTeamProviderInfo.mock.calls[0][1][testEnv].awscloudformation).toBeDefined();
    expect(stateManager_mock.setTeamProviderInfo.mock.calls[0][1][testEnv].awscloudformation[objKey]).toBeUndefined();
  });

  it('if tpi object specified, sets arn in object and sets global preInitTeamProviderInfo', () => {
    const tpi: Record<string, any> = {};
    setPermissionBoundaryArn(testArn, undefined, tpi);
    expect(tpi[testEnv].awscloudformation[objKey]).toEqual(testArn);
    expect(getPermissionBoundaryArn()).toEqual(testArn);
    delete (global as any).preInitTeamProviderInfo;
  });
});
