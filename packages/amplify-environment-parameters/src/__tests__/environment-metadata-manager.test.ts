import {
  pathManager, stateManager, $TSContext, $TSAny, EnvAwsInfo,
} from 'amplify-cli-core';
import { AmplifyBackend } from 'aws-sdk';
import { IEnvironmentMetadata } from '../types';
import { getProcessEventSpy } from './utils/process-event-spy';

jest.mock('amplify-cli-core');
jest.mock('aws-sdk');

const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;

pathManagerMock.findProjectRoot.mockReturnValue('project-root');
stateManagerMock.getLocalEnvInfo.mockReturnValue({ envName: 'testing' });
stateManagerMock.getTeamProviderInfo.mockReturnValue({});
stateManagerMock.getMeta.mockReturnValue({});

let initEnvMeta: (context: $TSContext) => Promise<void>;
let getEnvMeta: (envName?: string) => IEnvironmentMetadata;
let ensureEnvMeta: (context: $TSContext, envName?: string) => Promise<IEnvironmentMetadata>;

let stubContext: $TSContext;
let stubMeta: Record<string, unknown>;

const AmplifyBackendMock = AmplifyBackend as jest.MockedClass<typeof AmplifyBackend>;

beforeEach(() => {
  jest.clearAllMocks();
  // isolateModules does not work with async import()
  jest.isolateModules(() => {
    // eslint-disable-next-line global-require
    ({ initEnvMeta, getEnvMeta, ensureEnvMeta } = require('../environment-metadata-manager'));
  });
  stubMeta = {
    AuthRoleName: 'test-auth-role-name',
    AuthRoleArn: 'test-auth-role-arn',
    UnauthRoleArn: 'test-unauth-role-arn',
    UnauthRoleName: 'test-unauth-role-name',
    Region: 'test-region-1',
    DeploymentBucketName: 'test-deployment-bucket-name',
    StackName: 'test-stack-name',
    StackId: 'test-stack-id',
    AmplifyAppId: 'test-amplify-app-id',
  };

  stubContext = {
    exeInfo: {
      amplifyMeta: {
        providers: {
          awscloudformation: stubMeta,
        },
      },
    },
    amplify: {
      getAllEnvs: jest.fn().mockReturnValue(['testing']),
      invokePluginMethod: jest.fn(),
    } as $TSAny,
  } as $TSContext;
});

describe('initEnvMeta', () => {
  it('registers specified meta to be saved on exit', async () => {
    const executeProcessEvents = getProcessEventSpy();
    await initEnvMeta(stubContext);
    executeProcessEvents('exit');
    expect(stateManagerMock.setTeamProviderInfo).toBeCalledTimes(1);
    expect(stateManagerMock.setTeamProviderInfo.mock.calls[0]).toEqual([undefined, { testing: { awscloudformation: stubMeta } }]);
    expect(stateManagerMock.setMeta).toBeCalledTimes(1);
    expect(stateManagerMock.setMeta.mock.calls[0]).toEqual([undefined, { providers: { awscloudformation: stubMeta } }]);
  });

  it('removes deleted envs from tpi on exit', async () => {
    stateManagerMock.getTeamProviderInfo.mockReturnValue({
      env1: { test: 'remove me' },
    });
    const executeProcessEvents = getProcessEventSpy();
    await initEnvMeta(stubContext);
    executeProcessEvents('exit');
    expect(stateManagerMock.setTeamProviderInfo).toBeCalledTimes(2);
    expect(stateManagerMock.setTeamProviderInfo.mock.calls[1]).toEqual([undefined, { testing: { awscloudformation: stubMeta } }]);
  });

  it('preserves other contents of amplify-meta on save', async () => {
    const existingMeta = { some: 'existing stuff', another: 'thing' };
    stateManagerMock.getMeta.mockReturnValue(existingMeta);
    const executeProcessEvents = getProcessEventSpy();
    await initEnvMeta(stubContext);
    executeProcessEvents('exit');
    expect(stateManagerMock.setTeamProviderInfo).toBeCalledTimes(1);
    expect(stateManagerMock.setTeamProviderInfo.mock.calls[0]).toEqual([undefined, { testing: { awscloudformation: stubMeta } }]);
    expect(stateManagerMock.setMeta).toBeCalledTimes(1);
    expect(stateManagerMock.setMeta.mock.calls[0]).toEqual([undefined, { providers: { awscloudformation: stubMeta }, ...existingMeta }]);
  });

  it('throws if meta for current env already exists', async () => {
    await initEnvMeta(stubContext);
    await expect(initEnvMeta(stubContext)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"EnvironmentMetadata is already initialized for testing environment."`,
    );
  });
  it('throws if meta is missing a required param', async () => {
    delete stubMeta.AuthRoleName;
    await expect(initEnvMeta(stubContext)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Tried to initialize EnvironmentMetadata object without required key AuthRoleName"`,
    );
  });
  it('throws if meta has a non-string value', async () => {
    stubMeta.AmplifyAppId = 1234;
    await expect(initEnvMeta(stubContext)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Tried to initialize EnvironmentMetadata object with AmplifyAppId set to a non-string value"`,
    );
  });
});

describe('getEnvMeta', () => {
  it('returns initialized meta for given environment', async () => {
    await initEnvMeta(stubContext);
    validateEnvMetaAgainstStubMeta(getEnvMeta('testing'));
  });
  it('returns initialized meta for current environment when none specified', async () => {
    await initEnvMeta(stubContext);
    validateEnvMetaAgainstStubMeta(getEnvMeta());
  });
  it('throws if specified env not initialized', () => {
    expect(() => getEnvMeta()).toThrowErrorMatchingInlineSnapshot(
      `"Environment metadata not initialized for testing environment. Call ensureEnvMeta() to initialize."`,
    );
  });
});

describe('ensureEnvMeta', () => {
  beforeEach(() => {
    stateManagerMock.getMeta.mockReturnValue({ providers: { awscloudformation: stubMeta } });
  });

  it('does not save on exit when loading from amplify-meta file', async () => {
    const executeProcessEvents = getProcessEventSpy();
    await ensureEnvMeta(stubContext);
    executeProcessEvents('exit');
    expect(stateManagerMock.setTeamProviderInfo).toBeCalledTimes(0);
    expect(stateManagerMock.setMeta).toBeCalledTimes(0);
  });
  it('saves on exit when loading from #current-cloud-backend/amplify-meta file', async () => {
    stateManagerMock.getMeta.mockReturnValue({});
    stateManagerMock.getCurrentMeta.mockReturnValue({ providers: { awscloudformation: stubMeta } });
    const executeProcessEvents = getProcessEventSpy();
    await ensureEnvMeta(stubContext);
    executeProcessEvents('exit');
    expect(stateManagerMock.setTeamProviderInfo).toBeCalledTimes(1);
    expect(stateManagerMock.setMeta).toBeCalledTimes(1);
    expect(stateManagerMock.setMeta.mock.calls[0]).toEqual([undefined, { providers: { awscloudformation: stubMeta } }]);
  });
  it('returns existing meta if already initialized', async () => {
    const instance1 = await ensureEnvMeta(stubContext);
    const instance2 = await ensureEnvMeta(stubContext);
    expect(instance2).toBe(instance1);
  });
  it('initializes from calling amplify backend service if requested env is not the current env', async () => {
    stateManagerMock.getLocalAWSInfo.mockReturnValue({
      other: {
        AmplifyAppId: 'test-app-id',
      } as unknown as EnvAwsInfo,
    });
    const overrideMeta = { ...stubMeta, AmplifyAppId: 'override-value' };
    AmplifyBackendMock.mockImplementation(() => ({
      getBackend: jest.fn().mockReturnValue({
        promise: async () => ({
          Error: undefined,
          AmplifyMetaConfig: JSON.stringify({ providers: { awscloudformation: overrideMeta } }),
        }),
      }),
    } as unknown as AmplifyBackend));
    const executeProcessEvents = getProcessEventSpy();
    const envMeta = await ensureEnvMeta(stubContext, 'other');
    expect(envMeta.AmplifyAppId).toBe('override-value');
    stateManagerMock.getLocalEnvInfo.mockReturnValue({ envName: 'other' });
    executeProcessEvents('exit');
    expect(stateManagerMock.setMeta).toBeCalledTimes(1);
    expect(stateManagerMock.setMeta.mock.calls[0]).toEqual([undefined, { providers: { awscloudformation: overrideMeta } }]);
  });
});

const validateEnvMetaAgainstStubMeta = (envMeta: IEnvironmentMetadata): void => {
  Object.entries(stubMeta).forEach(([key, value]) => {
    expect((envMeta as any)[key]).toBe(value);
  });
};
