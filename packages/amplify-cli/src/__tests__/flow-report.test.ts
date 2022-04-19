import { CLIFlowReport } from '../domain/amplify-usageData/FlowReport';
import { stateManager } from 'amplify-cli-core';
import { AddS3ServiceConfiguration, AddStorageRequest, 
         ImportAuthRequest, CrudOperation, AddGeoRequest, 
         GeoServiceConfiguration, AccessType, MapStyle, AppSyncServiceConfiguration, AppSyncAPIKeyAuthType, AddApiRequest} from 'amplify-headless-interface';
import { v4 as uuid } from 'uuid';



describe('Test FlowReport Logging', () => {
    beforeAll(() => {
        const flowReport = CLIFlowReport.instance;
    });

    afterAll(() => {
        // CLIFlowReport.reset();
        jest.clearAllMocks();
    });

    it('Project Identifiers are correctly formed', () => {
       const flowReport = CLIFlowReport.instance;
       flowReport.setIsHeadless(true);
       //Mock the state-manager functions
       jest.mock('amplify-cli-core');
       jest.spyOn(stateManager, 'getProjectName').mockReturnValue(mockInputs.projectName);
       jest.spyOn(stateManager, 'getCurrentEnvName').mockReturnValueOnce(mockInputs.envName);
       jest.spyOn(stateManager, 'getAppID').mockReturnValue(mockInputs.appID)
       flowReport.assignProjectIdentifier();
       expect( flowReport.projectEnvIdentifier ).toEqual(`${mockInputs.projectName}${mockInputs.appID}${mockInputs.envName}`);
       expect( flowReport.projectIdentifier ).toEqual(`${mockInputs.projectName}${mockInputs.appID}`);
    });
  
    it('flow-log-headless-payload: (Auth) is redacted in flowReport', () => {
      const input = getAuthHeadlessTestInput();
      const inputString = JSON.stringify(input);
      const flowReport = CLIFlowReport.instance;
      flowReport.setIsHeadless(true);
      flowReport.setInput(mockInputs.headlessInput('auth', 'add'));
      flowReport.pushHeadlessFlow(inputString);
      expect(flowReport.optionFlowData[0].input).not.toContain(input.identityPoolId);
      expect(flowReport.optionFlowData[0].input).not.toContain(input.webClientId);
      expect(flowReport.optionFlowData[0].input).not.toContain(input.nativeClientId);
      const redactedInputString = flowReport.optionFlowData[0].input;
      const report = flowReport.getFlowReport();
      expect(report.isHeadless).toEqual(true);
      expect(report.input.plugin).toEqual('auth');
      expect(report.input.command).toEqual('add');
      expect(report.optionFlowData[0].input).toEqual(redactedInputString);
    });
  
    it('flow-log-headless-payload: (Storage S3) is redacted in flowReport', () => {
        const input = getAddStorageS3HeadlessTestInput();
        const inputString = JSON.stringify(input);
        const flowReport = CLIFlowReport.instance;
        flowReport.setIsHeadless(true);
        flowReport.assignProjectIdentifier();
        flowReport.setInput(mockInputs.headlessInput('storage', 'add'));
        flowReport.pushHeadlessFlow(inputString);
        expect(flowReport.optionFlowData[0].input).not.toContain(input.serviceConfiguration.bucketName);
        expect(flowReport.optionFlowData[0].input).not.toContain(input.serviceConfiguration.resourceName);
        expect(flowReport.optionFlowData[0].input).not.toContain(input.serviceConfiguration.lambdaTrigger?.name as string);
        const redactedInputString = flowReport.optionFlowData[0].input;

        const report = flowReport.getFlowReport();
        expect(report.isHeadless).toEqual(true);
        expect(report.input.plugin).toEqual('storage');
        expect(report.input.command).toEqual('add');
        expect(report.optionFlowData[0].input).toEqual(redactedInputString);

    });
  
    it('flow-log-headless-payload: (API GraphQL) headless-payload is redacted in flowReport', () => {
        const input = getGraphQLHeadlessTestInput();
        const inputString = JSON.stringify(input);
        const flowReport = CLIFlowReport.instance;
        flowReport.setIsHeadless(true);
        flowReport.assignProjectIdentifier();
        flowReport.setInput(mockInputs.headlessInput('api', 'add'));
        flowReport.pushHeadlessFlow(inputString);
        expect(flowReport.optionFlowData[0].input).not.toContain(input.serviceConfiguration.apiName); //resource name redacted
        const redactedInput = JSON.parse( flowReport.optionFlowData[0].input as unknown as string );
        expect(redactedInput.serviceConfiguration.transformSchema).toEqual(input.serviceConfiguration.transformSchema);//transform schema must exist
    });

    it('flow-log-headless-payload: (Geo) is redacted in flowReport', () => {
        const input = getGeoHeadlessTestInput();
        const inputString = JSON.stringify(input);
        const flowReport = CLIFlowReport.instance;
        flowReport.setIsHeadless(true);
        flowReport.assignProjectIdentifier();
        flowReport.setInput(mockInputs.headlessInput('geo', 'add'));
        flowReport.pushHeadlessFlow(inputString);
        expect(flowReport.optionFlowData[0].input).not.toContain(input.serviceConfiguration.name); //resource name redacted
        expect(flowReport.optionFlowData[0].input).toContain(input.serviceConfiguration.accessType);
        expect(flowReport.optionFlowData[0].input).toContain(input.serviceConfiguration.mapStyle);
    });

  });


/*** Helper functions and test data ***/
const mockAddStorageInput : AddS3ServiceConfiguration = {
    serviceName: 'S3',
    permissions: {
        auth: [CrudOperation.CREATE_AND_UPDATE, CrudOperation.READ, CrudOperation.DELETE],
        guest: [CrudOperation.CREATE_AND_UPDATE, CrudOperation.READ],
        groups: {
            Admin : [CrudOperation.CREATE_AND_UPDATE, CrudOperation.READ, CrudOperation.DELETE],
            Guest : [CrudOperation.CREATE_AND_UPDATE, CrudOperation.READ],
            Reader : [CrudOperation.READ]
        }
    },
    resourceName: 'testMockS3ResourceName',
    bucketName: 'testMockS3BucketName',
    lambdaTrigger: {
                mode: 'new',
                name: 'existingFunctionName'
            },
}

const getShortId = (prefix: string) => {
    const [shortId] = uuid().split('-');
    const mapId = `${prefix}${shortId}`;
    return mapId;
}

const mockAddGeoInput : GeoServiceConfiguration = {
    serviceName: "Map",
    name: getShortId('map'),
    accessType: AccessType.AuthorizedUsers,
    mapStyle: MapStyle.VectorEsriDarkGrayCanvas,
    setAsDefault: true
}

const appSyncAPIKeyAuthType : AppSyncAPIKeyAuthType = { 
                                    mode: 'API_KEY',
                                    expirationTime: Math.floor((Date.now()/1000) + 86400), //one day
                                }

const mockAddAPIInput : AppSyncServiceConfiguration = {
    serviceName: 'AppSync',
    apiName: "mockGQLAPIName",
    transformSchema: 'type User @model(subscriptions: null)\
                        @key(fields: ["userId"])\
                        @auth(rules: [\
                            { allow: owner, ownerField: "userId" }\
                        ]) {\
                        userId: ID!\
                        posts: [Post] @connection(keyName: "postByUser", fields: ["userId"])\
                        createdAt: String\
                        updatedAt: String\
                        }',
    defaultAuthType: appSyncAPIKeyAuthType
}

const mockInputs = {
    projectName: 'mockProjectName',
    envName : 'dev',
    appID : 'mockAppID',
    Auth: {
        USER_POOL_ID : 'user-pool-123',
        IDENTITY_POOL_ID : 'identity-pool-123',
        NATIVE_CLIENT_ID : 'native-app-client-123',
        WEB_CLIENT_ID : 'web-app-client-123'
    },
    StorageS3 : mockAddStorageInput,
    Geo : mockAddGeoInput,
    GraphQLAPI : mockAddAPIInput,
    headlessInput : (feature, command) => ({
        argv : [],
        plugin : feature,
        command : command
      })
}
const getAuthHeadlessTestInput = () => {
  const headlessPayload: ImportAuthRequest = {
    version: 1,
    userPoolId: mockInputs.Auth.USER_POOL_ID,
    identityPoolId: mockInputs.Auth.IDENTITY_POOL_ID,
    nativeClientId: mockInputs.Auth.NATIVE_CLIENT_ID,
    webClientId: mockInputs.Auth.WEB_CLIENT_ID,
  };
  return headlessPayload;
}

const getAddStorageS3HeadlessTestInput = () => {
    const headlessPayload: AddStorageRequest = {
        version: 1,
        serviceConfiguration : mockInputs.StorageS3
    };
    return headlessPayload;
}

const getGeoHeadlessTestInput = () => {
    const headlessPayload: AddGeoRequest = {
        version: 1,
        serviceConfiguration: mockInputs.Geo
    }
    return headlessPayload;
}

const getAPIHeadlessTestInput = () => {

}

const getGraphQLHeadlessTestInput = () => {
    const headlessPayload: AddApiRequest = {
        version: 1,
        serviceConfiguration: mockInputs.GraphQLAPI
    }
    return headlessPayload;
    
}

