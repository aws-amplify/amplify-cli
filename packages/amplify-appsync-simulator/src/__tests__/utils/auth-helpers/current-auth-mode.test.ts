import { getAuthorizationMode } from '../../../utils/auth-helpers/current-auth-mode';
import { extractHeader, getAllowedAuthTypes, isValidOIDCToken, extractJwtToken } from '../../../utils/auth-helpers/helpers';
import { AmplifyAppSyncSimulatorAuthenticationType, AmplifyAppSyncAPIConfig } from '../../../type-definition';

jest.mock('../../../utils/auth-helpers/helpers');

describe('getAuthorizationMode', () => {
  const extractHeaderMock = extractHeader as jest.Mock;
  const extractJwtTokenMock = extractJwtToken as jest.Mock;
  const getAllowedAuthTypesMock = getAllowedAuthTypes as jest.Mock;
  const isValidOIDCTokenMock = isValidOIDCToken as jest.Mock;
  let API_KEY = 'x-api-key';
  let AUTHORIZATION = 'my-token';
  let APPSYNC_CONFIG: AmplifyAppSyncAPIConfig;

  beforeEach(() => {
    jest.restoreAllMocks();
    APPSYNC_CONFIG = {
      apiKey: API_KEY,
      name: 'AppSync API',
      defaultAuthenticationType: {
        authenticationType: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
      },
      additionalAuthenticationProviders: [],
    };

    getAllowedAuthTypesMock.mockReturnValue([
      AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
      AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
      AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM,
      AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT,
    ]);

    extractHeaderMock.mockImplementation((header, key) => {
      switch (key) {
        case 'x-api-key':
          return API_KEY;
        case 'Authorization':
          return AUTHORIZATION;
        default:
          throw new Error(`Unexpected ${JSON.stringify(key)}`);
      }
    });
  });
  describe('API Key', () => {
    it('should return API_KEY auth mode when configured', () => {
      expect(getAuthorizationMode({}, APPSYNC_CONFIG)).toEqual(AmplifyAppSyncSimulatorAuthenticationType.API_KEY);
    });

    it('should throw error when API key does not match', () => {
      APPSYNC_CONFIG.apiKey = 'not-default';
      expect(() => getAuthorizationMode({}, APPSYNC_CONFIG)).toThrow('UnauthorizedException: Invalid API key');
    });

    it('should throw error when API_KEY is not one of the allowed Auth', () => {
      getAllowedAuthTypesMock.mockReturnValue([AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS]);
      expect(() => getAuthorizationMode({}, APPSYNC_CONFIG)).toThrow('UnauthorizedException: Invalid JWT token');
    });
  });

  describe('IAM', () => {
    beforeEach(() => {
      // Ensure API Key auth does not match
      API_KEY = undefined;
    });

    it('should return IAM when Authorization starts with AWS4-HMAC-SHA256', () => {
      AUTHORIZATION = 'AWS4-HMAC-SHA256:actual-key';
      expect(getAuthorizationMode({}, APPSYNC_CONFIG)).toEqual(AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM);
    });

    it('should throw error when the when AuthMode is includes IAM and authorization does not start with AWS4-HMAC-SHA256', () => {
      AUTHORIZATION = 'Not AWS4-HMAC-SHA256:actual-key';
      expect(() => getAuthorizationMode({}, APPSYNC_CONFIG)).toThrow('UnauthorizedException: Invalid JWT token');
    });

    it('should throw error when IAM is not in the allowed Authorization', () => {
      getAllowedAuthTypesMock.mockReturnValue([AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS]);
      AUTHORIZATION = 'AWS4-HMAC-SHA256:actual-key';
      expect(() => getAuthorizationMode({}, APPSYNC_CONFIG)).toThrow('UnauthorizedException: Invalid JWT token');
    });
  });

  describe('Cognito User Pools', () => {
    beforeEach(() => {
      // Ensure API Key auth does not match
      API_KEY = undefined;
      AUTHORIZATION = 'encoded token goes here';
    });

    it('should return AMAZON_COGNITO_USER_POOLS as authorization mode', () => {
      extractJwtTokenMock.mockReturnValue({
        iss: 'https://cognito-idp.aws.amazon.com',
      });
      expect(getAuthorizationMode({}, APPSYNC_CONFIG)).toEqual(AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS);
    });

    it('should throw error when the issuer does not start with https://cognito-idp.aws', () => {
      extractJwtTokenMock.mockReturnValue({
        iss: 'https://not-cognito-idp.aws.amazon.com',
      });
      expect(() => getAuthorizationMode({}, APPSYNC_CONFIG)).toThrow('UnauthorizedException: Invalid JWT token');
    });

    it('should throw error when the COGNITO is not allowed auth type', () => {
      extractJwtTokenMock.mockReturnValue({
        iss: 'https://cognito-idp.aws.amazon.com',
      });
      getAllowedAuthTypesMock.mockReturnValue([AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM]);
      expect(() => getAuthorizationMode({}, APPSYNC_CONFIG)).toThrow('UnauthorizedException: Invalid JWT token');
    });
  });

  describe('OpenID Connect', () => {
    let jwtToken;
    beforeEach(() => {
      // Ensure API Key auth does not match
      API_KEY = undefined;
      AUTHORIZATION = 'encoded token goes here';
      jwtToken = {
        iss: 'https://oidc-provider.aws.amazon.com',
      };
      extractJwtTokenMock.mockReturnValue(jwtToken);
    });

    it('should return OIDC as authorization mode', () => {
      isValidOIDCTokenMock.mockReturnValue(true);
      expect(getAuthorizationMode({}, APPSYNC_CONFIG)).toEqual(AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT);
      expect(isValidOIDCTokenMock).toBeCalledWith(jwtToken, [
        APPSYNC_CONFIG.defaultAuthenticationType,
        ...APPSYNC_CONFIG.additionalAuthenticationProviders,
      ]);
    });

    it('should throw error when the JWT token has a issuer which is other then the whitelist', () => {
      isValidOIDCTokenMock.mockReturnValue(false);
      expect(() => getAuthorizationMode({}, APPSYNC_CONFIG)).toThrow('UnauthorizedException: Invalid JWT token');
    });

    it('should throw error OIDC is not an allowed auth type', () => {
      isValidOIDCTokenMock.mockReturnValue(true);
      getAllowedAuthTypesMock.mockReturnValue([AmplifyAppSyncSimulatorAuthenticationType.API_KEY]);
      expect(() => getAuthorizationMode({}, APPSYNC_CONFIG)).toThrow('UnauthorizedException: Invalid JWT token');
    });
  });

  it('should throw error when not auth type matches', () => {
    API_KEY = undefined;
    AUTHORIZATION = undefined;

    expect(() => getAuthorizationMode({}, APPSYNC_CONFIG)).toThrow('UnauthorizedException: Missing authorization');
  });
});
