import { executeAmplifyHeadlessCommand } from '../../../src';
import { ImportAuthRequest } from 'amplify-headless-interface';
import { messages } from '../../provider-utils/awscloudformation/assets/string-maps';
import { stateManager, FeatureFlags, JSONUtilities } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

jest.mock('amplify-prompts', () => ({
  printer: {
    info: jest.fn(),
  },
}));

jest.mock('amplify-cli-core', () => ({
  ...(jest.requireActual('amplify-cli-core') as {}),
  stateManager: {
    setResourceParametersJson: jest.fn(),
    getMeta: jest.fn().mockReturnValue({
      providers: {
        awscloudformation: {},
      },
    }),
  },
  FeatureFlags: {
    getBoolean: () => false,
  },
  JSONUtilities: {
    parse: JSON.parse,
  },
}));

jest.mock('../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state');

describe('import auth headless', () => {
  let mockContext: any;
  const USER_POOL_ID = 'user-pool-123';
  const IDENTITY_POOL_ID = 'identity-pool-123';
  const NATIVE_CLIENT_ID = 'native-app-client-123';
  const WEB_CLIENT_ID = 'web-app-client-123';
  const defaultUserPoolClients = [
    {
      UserPoolId: USER_POOL_ID,
      ClientId: WEB_CLIENT_ID,
    },
    {
      UserPoolId: USER_POOL_ID,
      ClientId: NATIVE_CLIENT_ID,
      ClientSecret: 'secret-123',
    },
  ];
  const headlessPayload: ImportAuthRequest = {
    version: 1,
    userPoolId: USER_POOL_ID,
    identityPoolId: IDENTITY_POOL_ID,
    nativeClientId: NATIVE_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
  };
  const headlessPayloadString: string = JSON.stringify(headlessPayload);
  const projectConfig = {
    projectName: 'amplify-import-headless-auth-test',
  };
  const projectDetails = {
    projectConfig,
    amplifyMeta: {},
  };
  const getUserPoolDetails = {
    Id: USER_POOL_ID,
    MfaConfiguration: 'ON',
  };
  const identityPoolDetails = [
    {
      IdentityPoolId: IDENTITY_POOL_ID,
      IdentityPoolName: 'identity-pool',
      AllowUnauthenticatedIdentities: true,
      CognitoIdentityProviders: [
        {
          ProviderName: `web-provider-${USER_POOL_ID}`,
          ClientId: WEB_CLIENT_ID,
        },
        {
          ProviderName: `native-provider-${USER_POOL_ID}`,
          ClientId: NATIVE_CLIENT_ID,
        },
      ],
    },
  ];
  const mfaResponse = {
    SoftwareTokenMfaConfiguration: {
      Enabled: true,
    },
    MfaConfiguration: 'ON',
  };
  const getIdentityPoolRolesResponse = {
    authRoleArn: 'arn:authRole:123',
    authRoleName: 'authRole',
    unauthRoleName: 'unAuthRole',
    unauthRoleArn: 'arn:unAuthRole:123',
  };
  // mock fns
  const cognitoUserPoolServiceMock = jest.fn();
  const cognitoIdentityPoolServiceMock = jest.fn();
  const pluginInstanceMock = jest.fn();
  const getUserPoolDetailsMock = jest.fn();
  const listUserPoolClientsMock = jest.fn();
  const getUserPoolMfaConfigMock = jest.fn();
  const listIdentityPoolDetailsMock = jest.fn();
  const getIdentityPoolRolesMock = jest.fn();
  const getProjectConfigMock = jest.fn().mockReturnValue(projectConfig);
  const getProjectDetailsMock = jest.fn().mockReturnValue(projectDetails);

  beforeAll(() => {
    const loadResourceParametersMock = jest.fn();
    const updateAmplifyMetaAfterResourceAddMock = jest.fn();
    const pluginInstance = {
      loadResourceParameters: loadResourceParametersMock,
      createCognitoUserPoolService: cognitoUserPoolServiceMock.mockReturnValue({
        getUserPoolDetails: getUserPoolDetailsMock.mockResolvedValueOnce(getUserPoolDetails),
        listUserPoolClients: listUserPoolClientsMock.mockResolvedValueOnce(defaultUserPoolClients),
        getUserPoolMfaConfig: getUserPoolMfaConfigMock.mockResolvedValue(mfaResponse),
      }),
      createIdentityPoolService: cognitoIdentityPoolServiceMock.mockReturnValue({
        listIdentityPoolDetails: listIdentityPoolDetailsMock.mockResolvedValue(identityPoolDetails),
        getIdentityPoolRoles: getIdentityPoolRolesMock.mockResolvedValue(getIdentityPoolRolesResponse),
      }),
    };
    mockContext = {
      amplify: {
        getProjectConfig: getProjectConfigMock,
        getProjectDetails: getProjectDetailsMock,
        updateamplifyMetaAfterResourceAdd: updateAmplifyMetaAfterResourceAddMock,
        getPluginInstance: pluginInstanceMock.mockReturnValue(pluginInstance),
        saveEnvResourceParameters: jest.fn(),
      },
      print: {
        warning: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
      },
      parameters: {
        first: 'mockFirst',
      },
      input: {
        command: 'import',
      },
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process command successfully', async () => {
    await executeAmplifyHeadlessCommand(mockContext, headlessPayloadString);

    expect(getUserPoolDetailsMock).toBeCalledWith(USER_POOL_ID);
    expect(listUserPoolClientsMock).toBeCalledWith(USER_POOL_ID);
    expect(getUserPoolMfaConfigMock).toBeCalledWith(USER_POOL_ID);
    expect(listIdentityPoolDetailsMock).toBeCalledWith();
    expect(getIdentityPoolRolesMock).toBeCalledWith(IDENTITY_POOL_ID);
  });

  it('should warn if auth has already been added', async () => {
    getProjectDetailsMock.mockReturnValueOnce({
      projectConfig,
      amplifyMeta: {
        auth: {
          foo: 'bar',
        },
      },
    });

    await executeAmplifyHeadlessCommand(mockContext, headlessPayloadString);

    expect(mockContext.print.warning).toBeCalledWith(messages.authExists);
  });

  it('should throw user pool not found exception', async () => {
    try {
      getUserPoolDetailsMock.mockRejectedValueOnce({
        name: 'ResourceNotFoundException',
      });

      await executeAmplifyHeadlessCommand(mockContext, headlessPayloadString);

      fail('should throw error');
    } catch (e) {
      expect(e.message).toBe(`The previously configured Cognito User Pool: '' (user-pool-123) cannot be found.`);
    }
  });

  it('should throw web clients not found exception ', async () => {
    try {
      listUserPoolClientsMock.mockResolvedValue([]);

      await executeAmplifyHeadlessCommand(mockContext, headlessPayloadString);

      fail('should throw error');
    } catch (e) {
      expect(e.message).toBe(
        'The selected Cognito User Pool does not have at least 1 Web app client configured. Web app clients are app clients without a client secret.',
      );
    }
  });

  it('should throw no matching identity pool found exception', async () => {
    const INVALID_USER_POOL_ID = USER_POOL_ID + '-invalid';
    const invalidHeadlessPayload = {
      ...headlessPayload,
      userPoolId: INVALID_USER_POOL_ID,
    };
    const invalidHeadlessPayloadString = JSON.stringify(invalidHeadlessPayload);
    try {
      getUserPoolDetailsMock.mockResolvedValueOnce({
        Id: INVALID_USER_POOL_ID,
        MfaConfiguration: 'ON',
      });
      listUserPoolClientsMock.mockResolvedValueOnce(defaultUserPoolClients);

      await executeAmplifyHeadlessCommand(mockContext, invalidHeadlessPayloadString);

      fail('should throw error');
    } catch (e) {
      expect(e.message).toBe('There are no Identity Pools found which has the selected Cognito User Pool configured as identity provider.');
    }
  });
});
