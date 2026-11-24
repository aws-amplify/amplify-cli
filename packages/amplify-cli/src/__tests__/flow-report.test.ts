import { stateManager } from '@aws-amplify/amplify-cli-core';
import {
  AddS3ServiceConfiguration,
  AddStorageRequest,
  ImportAuthRequest,
  CrudOperation,
  AddGeoRequest,
  GeoServiceConfiguration,
  AccessType,
  MapStyle,
  AppSyncServiceConfiguration,
  AppSyncAPIKeyAuthType,
  AddApiRequest,
} from 'amplify-headless-interface';
import { v4 as uuid } from 'uuid';
import { CLIFlowReport } from '../domain/amplify-usageData/FlowReport';
import { CLIInput } from '../domain/command-input';
import { homedir } from 'os';

describe('Test FlowReport Logging', () => {
  beforeAll(() => {});

  afterAll(() => {
    jest.clearAllMocks();
  });
  it('flow-log-interactive-payload: Interactive payload is available in payload', () => {
    const flowReport = new CLIFlowReport();
    flowReport.pushInteractiveFlow(mockInputs.interactivePrompt, mockInputs.interactiveValue);
    expect(flowReport.optionFlowData[0].input).toContain(mockInputs.interactiveValue);
  });
  it('Project Identifiers are correctly formed', () => {
    const flowReport = new CLIFlowReport();
    flowReport.setIsHeadless(true);
    flowReport.setVersion(mockInputs.version);
    // Mock the state-manager functions
    jest.mock('@aws-amplify/amplify-cli-core');
    jest.spyOn(stateManager, 'getProjectName').mockReturnValue(mockInputs.projectName);
    jest.spyOn(stateManager, 'getCurrentEnvName').mockReturnValueOnce(mockInputs.envName);
    jest.spyOn(stateManager, 'getAppID').mockReturnValue(mockInputs.appID);
    flowReport.assignProjectIdentifier();
    expect(flowReport.projectEnvIdentifier).toEqual('e5ea1967add3f4ce56bfd90b0a533fc0'); // value is always forward reproducible
    expect(flowReport.projectIdentifier).toEqual('8c73d955105e310dcab5e091574f9df3'); // value is always forward reproducible
    expect(flowReport.version).toEqual(mockInputs.version);
  });

  it('flow-log-headless-payload: (Auth) records a placeholder for headless parameters', () => {
    const input = getAuthHeadlessTestInput();
    const inputString = JSON.stringify(input);
    const flowReport = new CLIFlowReport();
    flowReport.pushHeadlessFlow(inputString, mockInputs.headlessInput('auth', 'add'));
    expect(flowReport.optionFlowData[0].input).not.toContain(input.identityPoolId);
    expect(flowReport.optionFlowData[0].input).not.toContain(input.webClientId);
    expect(flowReport.optionFlowData[0].input).not.toContain(input.nativeClientId);
    const report = flowReport.getFlowReport();
    expect(report.isHeadless).toEqual(true);
    expect(report.input.plugin).toEqual('auth');
    expect(report.input.command).toEqual('add');
    expect(report.optionFlowData[0].input).toEqual('****');
  });

  it('flow-log-headless-payload: (Storage S3) records a placeholder for headless parameters', () => {
    const input = getAddStorageS3HeadlessTestInput();
    const inputString = JSON.stringify(input);
    const flowReport = new CLIFlowReport();
    flowReport.assignProjectIdentifier();
    flowReport.pushHeadlessFlow(inputString, mockInputs.headlessInput('storage', 'add'));
    expect(flowReport.optionFlowData[0].input).not.toContain(input.serviceConfiguration.bucketName);
    expect(flowReport.optionFlowData[0].input).not.toContain(input.serviceConfiguration.resourceName);
    expect(flowReport.optionFlowData[0].input).not.toContain(input.serviceConfiguration.lambdaTrigger?.name as string);

    const report = flowReport.getFlowReport();
    expect(report.isHeadless).toEqual(true);
    expect(report.input.plugin).toEqual('storage');
    expect(report.input.command).toEqual('add');
    expect(report.optionFlowData[0].input).toEqual('****');
  });

  it('flow-log-headless-payload: (API GraphQL) records a placeholder for headless parameters', () => {
    const input = getGraphQLHeadlessTestInput();

    const inputString = JSON.stringify(input);
    const flowReport = new CLIFlowReport();
    flowReport.assignProjectIdentifier();
    flowReport.pushHeadlessFlow(inputString, mockInputs.headlessInput('api', 'add'));
    expect(flowReport.optionFlowData[0].input).not.toContain(input.serviceConfiguration.apiName);
    expect(flowReport.optionFlowData[0].input).not.toContain(input.serviceConfiguration.transformSchema);
    expect(flowReport.optionFlowData[0].input).toEqual('****');
  });

  it('flow-log-headless-payload: (Geo) records a placeholder for headless parameters', () => {
    const input = getGeoHeadlessTestInput();
    const inputString = JSON.stringify(input);
    const flowReport = new CLIFlowReport();
    flowReport.assignProjectIdentifier();
    flowReport.pushHeadlessFlow(inputString, mockInputs.headlessInput('geo', 'add'));
    expect(flowReport.optionFlowData[0].input).not.toContain(input.serviceConfiguration.name);
    expect(flowReport.optionFlowData[0].input).toEqual('****');
  });

  it('runtime does not contain home directory info', () => {
    const flowReport = new CLIFlowReport();
    flowReport.setInput(mockInputs.headlessInput('auth', 'add'));

    expect(flowReport.runtime).not.toContain(homedir());
  });

  it('executable does not contain home directory info', () => {
    const flowReport = new CLIFlowReport();
    flowReport.setInput(mockInputs.headlessInput('auth', 'add'));

    expect(flowReport.executable).not.toContain(homedir());
  });

  it('report input only includes command metadata', () => {
    const flowReport = new CLIFlowReport();
    const input = new CLIInput(['node', 'amplify', 'init', '--test-option', 'TEST_CANARY_VALUE']);
    input.plugin = 'core';
    input.command = 'init';
    input.options = { 'test-option': 'TEST_CANARY_VALUE' };

    flowReport.setInput(input);
    const report = flowReport.getFlowReport();

    expect(report.input).toEqual({ argv: [], plugin: 'core', command: 'init' });
    expect(report.cmd).toEqual('init');
    expect(JSON.stringify(report)).not.toContain('TEST_CANARY_VALUE');
  });

  it('headless report only includes command metadata', () => {
    const flowReport = new CLIFlowReport();
    const input = new CLIInput(['node', 'amplify', 'add', 'storage', '--headless', '--test-option', 'TEST_CANARY_VALUE']);
    input.plugin = 'storage';
    input.command = 'add';
    input.options = { headless: true, 'test-option': 'TEST_CANARY_VALUE' };
    const headlessPayload: AddStorageRequest = {
      version: 1,
      serviceConfiguration: {
        serviceName: 'S3',
        resourceName: 'TEST_CANARY_VALUE',
        bucketName: 'TEST_CANARY_VALUE',
        permissions: {
          auth: [CrudOperation.READ],
          groups: { TEST_CANARY_VALUE: [CrudOperation.READ] },
        },
      },
    };

    flowReport.pushHeadlessFlow(JSON.stringify(headlessPayload), input);
    const report = flowReport.getFlowReport();

    expect(report.input).toEqual({ argv: [], plugin: 'storage', command: 'add' });
    expect(report.isHeadless).toEqual(true);
    expect(report.optionFlowData).toEqual([{ input: '****', timestamp: expect.any(Number) }]);
    expect(JSON.stringify(report)).not.toContain('TEST_CANARY_VALUE');
  });

  it('report input records positional arguments as placeholders', () => {
    const flowReport = new CLIFlowReport();
    const input = new CLIInput(['node', 'amplify', 'env', 'checkout', 'TEST_CANARY_VALUE']);
    input.plugin = 'core';
    input.command = 'env';
    input.subCommands = ['checkout', 'TEST_CANARY_VALUE'];

    flowReport.setInput(input);
    const report = flowReport.getFlowReport();

    expect(report.input).toEqual({ argv: [], plugin: 'core', command: 'env', subCommands: ['checkout', '<unknown>'] });
    expect(report.cmd).toEqual('env');
    expect(report.subCmd).toEqual('checkout');
    expect(JSON.stringify(report)).not.toContain('TEST_CANARY_VALUE');
  });

  it('report input records an unknown command and every name after it as placeholders', () => {
    const flowReport = new CLIFlowReport();
    const input = new CLIInput(['node', 'amplify', 'TEST_CANARY_VALUE', 'env', 'checkout']);
    input.plugin = 'core';
    input.command = 'TEST_CANARY_VALUE';
    input.subCommands = ['env', 'checkout'];

    flowReport.setInput(input);
    const report = flowReport.getFlowReport();

    expect(report.input).toEqual({ argv: [], plugin: 'core', command: '<unknown>', subCommands: ['<unknown>', '<unknown>'] });
    expect(report.cmd).toEqual('<unknown>');
    expect(report.subCmd).toEqual('<unknown>');
    expect(JSON.stringify(report)).not.toContain('TEST_CANARY_VALUE');
  });

  it('report input records commands of an unknown plugin as placeholders', () => {
    const flowReport = new CLIFlowReport();
    const input = new CLIInput(['node', 'amplify', 'TEST_CANARY_VALUE', 'add']);
    input.plugin = 'TEST_CANARY_VALUE';
    input.command = 'add';

    flowReport.setInput(input);
    const report = flowReport.getFlowReport();

    expect(report.input).toEqual({ argv: [], plugin: '<unknown>', command: '<unknown>' });
    expect(report.cmd).toEqual('<unknown>');
    expect(report.subCmd).toEqual('<unknown>');
  });

  it('report cmd and subCmd are the plugin and command names when a plugin is named', () => {
    const flowReport = new CLIFlowReport();
    const input = new CLIInput(['node', 'amplify', 'api', 'add']);
    input.plugin = 'api';
    input.command = 'add';

    flowReport.setInput(input);
    const report = flowReport.getFlowReport();

    expect(report.cmd).toEqual('api');
    expect(report.subCmd).toEqual('add');
  });

  it('report cmd is the command name of a core command without subcommands', () => {
    const flowReport = new CLIFlowReport();
    const input = new CLIInput(['node', 'amplify', 'status']);
    input.plugin = 'core';
    input.command = 'status';

    flowReport.setInput(input);
    const report = flowReport.getFlowReport();

    expect(report.cmd).toEqual('status');
    expect(report.subCmd).toBeUndefined();
  });

  it('report input does not match inherited object property names', () => {
    const flowReport = new CLIFlowReport();
    const input = new CLIInput(['node', 'amplify', 'env', 'constructor', '__proto__']);
    input.plugin = 'core';
    input.command = 'env';
    input.subCommands = ['constructor', '__proto__'];

    flowReport.setInput(input);

    expect(flowReport.getFlowReport().input).toEqual({
      argv: [],
      plugin: 'core',
      command: 'env',
      subCommands: ['<unknown>', '<unknown>'],
    });
  });

  it('report input records a plugin command reached through a plugin alias', () => {
    const flowReport = new CLIFlowReport();
    const input = new CLIInput(['node', 'amplify', 'override', 'root']);
    input.plugin = 'root';
    input.command = 'override';

    flowReport.setInput(input);

    expect(flowReport.getFlowReport().input).toEqual({ argv: [], plugin: 'root', command: 'override' });
  });

  it('report input records the command that help is shown for', () => {
    const flowReport = new CLIFlowReport();
    const input = new CLIInput(['node', 'amplify', 'mock', 'function', 'TEST_CANARY_VALUE', '--help']);
    input.plugin = 'mock';
    input.command = 'help';
    input.subCommands = ['mock', 'function', 'TEST_CANARY_VALUE'];
    input.options = { help: true };

    flowReport.setInput(input);
    const report = flowReport.getFlowReport();

    expect(report.input).toEqual({ argv: [], plugin: 'mock', command: 'help', subCommands: ['mock', 'function', '<unknown>'] });
    expect(JSON.stringify(report)).not.toContain('TEST_CANARY_VALUE');
  });
});

/** * Helper functions and test data ***/
const mockAddStorageInput: AddS3ServiceConfiguration = {
  serviceName: 'S3',
  permissions: {
    auth: [CrudOperation.CREATE_AND_UPDATE, CrudOperation.READ, CrudOperation.DELETE],
    guest: [CrudOperation.CREATE_AND_UPDATE, CrudOperation.READ],
    groups: {
      Admin: [CrudOperation.CREATE_AND_UPDATE, CrudOperation.READ, CrudOperation.DELETE],
      Guest: [CrudOperation.CREATE_AND_UPDATE, CrudOperation.READ],
      Reader: [CrudOperation.READ],
    },
  },
  resourceName: 'testMockS3ResourceName',
  bucketName: 'testMockS3BucketName',
  lambdaTrigger: {
    mode: 'new',
    name: 'existingFunctionName',
  },
};

const getShortId = (prefix: string) => {
  const [shortId] = uuid().split('-');
  const mapId = `${prefix}${shortId}`;
  return mapId;
};

const mockAddGeoInput: GeoServiceConfiguration = {
  serviceName: 'Map',
  name: getShortId('map'),
  accessType: AccessType.AuthorizedUsers,
  mapStyle: MapStyle.VectorEsriDarkGrayCanvas,
  setAsDefault: true,
};

const appSyncAPIKeyAuthType: AppSyncAPIKeyAuthType = {
  mode: 'API_KEY',
  expirationTime: Math.floor(Date.now() / 1000 + 86400), // one day
};

const mockAddAPIInput: AppSyncServiceConfiguration = {
  serviceName: 'AppSync',
  apiName: 'mockGQLAPIName',
  transformSchema:
    'type User @model(subscriptions: null)\
                        @key(fields: ["userId"])\
                        @auth(rules: [\
                            { allow: owner, ownerField: "userId" }\
                        ]) {\
                        userId: ID!\
                        posts: [Post] @connection(keyName: "postByUser", fields: ["userId"])\
                        createdAt: String\
                        updatedAt: String\
                        }',
  defaultAuthType: appSyncAPIKeyAuthType,
};

const mockInputs = {
  projectName: 'mockProjectName',
  envName: 'dev',
  appID: 'mockAppID',
  Auth: {
    USER_POOL_ID: 'user-pool-123',
    IDENTITY_POOL_ID: 'identity-pool-123',
    NATIVE_CLIENT_ID: 'native-app-client-123',
    WEB_CLIENT_ID: 'web-app-client-123',
  },
  StorageS3: mockAddStorageInput,
  Geo: mockAddGeoInput,
  GraphQLAPI: mockAddAPIInput,
  headlessInput: (feature, command) => ({
    argv: [`${homedir()}/.amplify/bin/amplify.exe`, `${homedir()}/amplify-cli/build/node_modules/@aws-amplify/cli-internal/bin/amplify`],
    plugin: feature,
    command,
  }),
  interactivePrompt: 'Enter resource name',
  interactiveValue: 'mockResourceID',
  version: '1.0',
};
const getAuthHeadlessTestInput = () => {
  const headlessPayload: ImportAuthRequest = {
    version: 1,
    userPoolId: mockInputs.Auth.USER_POOL_ID,
    identityPoolId: mockInputs.Auth.IDENTITY_POOL_ID,
    nativeClientId: mockInputs.Auth.NATIVE_CLIENT_ID,
    webClientId: mockInputs.Auth.WEB_CLIENT_ID,
  };
  return headlessPayload;
};

const getAddStorageS3HeadlessTestInput = () => {
  const headlessPayload: AddStorageRequest = {
    version: 1,
    serviceConfiguration: mockInputs.StorageS3,
  };
  return headlessPayload;
};

const getGeoHeadlessTestInput = () => {
  const headlessPayload: AddGeoRequest = {
    version: 1,
    serviceConfiguration: mockInputs.Geo,
  };
  return headlessPayload;
};

const getGraphQLHeadlessTestInput = () => {
  const headlessPayload: AddApiRequest = {
    version: 1,
    serviceConfiguration: mockInputs.GraphQLAPI,
  };
  return headlessPayload;
};
