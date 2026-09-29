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
import { Redactor } from '@aws-amplify/amplify-cli-logger';
import { CLIFlowReport } from '../domain/amplify-usageData/FlowReport';
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

  it('flow-log-headless-payload: (Auth) is redacted in flowReport', () => {
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
    expect(report.optionFlowData[0].input).toEqual(Redactor(inputString));
  });

  it('flow-log-headless-payload: (Storage S3) is redacted in flowReport', () => {
    const input = getAddStorageS3HeadlessTestInput();
    const inputString = JSON.stringify(input);
    const flowReport = new CLIFlowReport();
    flowReport.assignProjectIdentifier();
    flowReport.pushHeadlessFlow(inputString, mockInputs.headlessInput('storage', 'add'));
    expect(flowReport.optionFlowData[0].input).not.toContain(input.serviceConfiguration.bucketName);
    expect(flowReport.optionFlowData[0].input).not.toContain(input.serviceConfiguration.resourceName);
    expect(flowReport.optionFlowData[0].input).not.toContain(input.serviceConfiguration.lambdaTrigger?.name as string);
    expect(flowReport.optionFlowData[0].input).toContain(redactValue('bucketName', input.serviceConfiguration.bucketName));
    expect(flowReport.optionFlowData[0].input).toContain(redactValue('resourceName', input.serviceConfiguration.resourceName));
    expect(flowReport.optionFlowData[0].input).toContain(redactValue('name', input.serviceConfiguration.lambdaTrigger?.name as string));

    const report = flowReport.getFlowReport();
    expect(report.isHeadless).toEqual(true);
    expect(report.input.plugin).toEqual('storage');
    expect(report.input.command).toEqual('add');
    expect(report.optionFlowData[0].input).toEqual(Redactor(inputString));
  });

  it('flow-log-headless-payload: (API GraphQL) headless-payload is redacted in flowReport', () => {
    const input = getGraphQLHeadlessTestInput();

    const inputString = JSON.stringify(input);
    const flowReport = new CLIFlowReport();
    flowReport.assignProjectIdentifier();
    flowReport.pushHeadlessFlow(inputString, mockInputs.headlessInput('api', 'add'));
    expect(flowReport.optionFlowData[0].input).not.toContain(input.serviceConfiguration.apiName); // resource name redacted
    expect(flowReport.optionFlowData[0].input).toContain(redactValue('apiName', input.serviceConfiguration.apiName));
    const redactedInput = JSON.parse(flowReport.optionFlowData[0].input as unknown as string);
    expect(redactedInput.serviceConfiguration.transformSchema).toEqual(input.serviceConfiguration.transformSchema); // transform schema must exist
  });

  it('flow-log-headless-payload: (Geo) is redacted in flowReport', () => {
    const input = getGeoHeadlessTestInput();
    const inputString = JSON.stringify(input);
    const redactedName = redactValue('name', input.serviceConfiguration.name);
    const flowReport = new CLIFlowReport();
    flowReport.assignProjectIdentifier();
    flowReport.pushHeadlessFlow(inputString, mockInputs.headlessInput('geo', 'add'));
    expect(flowReport.optionFlowData[0].input).not.toContain(input.serviceConfiguration.name); // resource name redacted
    expect(flowReport.optionFlowData[0].input).toContain(redactedName); // resource name redacted
    expect(flowReport.optionFlowData[0].input).toContain(input.serviceConfiguration.accessType);
    expect(flowReport.optionFlowData[0].input).toContain(input.serviceConfiguration.mapStyle);
    expect(flowReport.optionFlowData[0].input).toEqual(Redactor(inputString));
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
});

const redactValue = (key: string, value: unknown) => {
  const retVal = JSON.parse(Redactor(JSON.stringify({ [key]: value })));
  return retVal[key];
};

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
