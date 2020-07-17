import jwtDecode from 'jwt-decode';
import {
  AmplifyAppSyncAPIConfig,
  AmplifyAppSyncAuthenticationProviderConfig,
  AmplifyAppSyncSimulatorAuthenticationType,
} from '../../../type-definition';
import { extractHeader, getAllowedAuthTypes, isValidOIDCToken, JWTToken } from '../../../utils/auth-helpers/helpers';

jest.mock('jwt-decode');

describe('auth helpers', () => {
  let token: JWTToken;
  beforeEach(() => {
    token = {
      iss: 'cognito.aws.amazon.com',
      sub: 'sub',
      exp: 2986225803296,
      aud: 'aud',
      iat: 1586225803296,
      nbf: 1586225803296,
      username: 'user-1',
      'cognito:username': 'user1',
    };
  });
  describe('extractJwtToken', () => {
    const mockJwtDecode = jwtDecode as jest.Mock<jwtDecode>;
    beforeEach(() => {
      jest.resetAllMocks();
    });
    it('should return token', () => {
      mockJwtDecode.mockReturnValue(token);
      const mockEncodedToken = 'token';
      expect(jwtDecode(mockEncodedToken)).toEqual(token);
      expect(mockJwtDecode).toHaveBeenCalledWith(mockEncodedToken);
    });

    it('should return null when token is empty or invalid', () => {
      mockJwtDecode.mockRestore();
      expect(jwtDecode(null)).toBeUndefined();
    });
  });

  describe('isValidOIDCToken', () => {
    const configuredAuthTypes: AmplifyAppSyncAuthenticationProviderConfig[] = [
      {
        authenticationType: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
      },
      {
        authenticationType: AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT,
        openIDConnectConfig: {
          Issuer: 'http://amazon.com',
        },
      },
      {
        authenticationType: AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT,
        openIDConnectConfig: {
          Issuer: 'cognito.aws.amazon.com',
        },
      },
    ];
    it('should return true when token has allowed issuer', () => {
      expect(isValidOIDCToken(token, configuredAuthTypes)).toBeTruthy();
    });

    it('should return false when token does not have valid issuer', () => {
      token.iss = 'invalid-issuer';
      expect(isValidOIDCToken(token, configuredAuthTypes)).toBeFalsy();
    });

    it('should return false when there are no oidc providers configured', () => {
      expect(
        isValidOIDCToken(token, [
          {
            authenticationType: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
          },
        ]),
      ).toBeFalsy();
    });
  });

  describe('extractHeader', () => {
    it('should return the header when the key match', () => {
      expect(extractHeader({ authorization: 'abcd' }, 'authorization')).toEqual('abcd');
      expect(extractHeader({ Authorization: 'abcd' }, 'authorization')).toEqual('abcd');
    });

    it('should return undefined when there are no matching headers', () => {
      expect(extractHeader({ authorization: 'abcd' }, 'something-else')).toBeUndefined();
    });
  });

  describe('getAllowedAuthTypes', () => {
    it('should merge all auth types', () => {
      const config: AmplifyAppSyncAPIConfig = {
        name: 'appsync-api',
        additionalAuthenticationProviders: [
          {
            authenticationType: AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT,
            openIDConnectConfig: {
              Issuer: 'cognito',
            },
          },
          {
            authenticationType: AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM,
          },
          {
            authenticationType: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
            cognitoUserPoolConfig: {
              AppIdClientRegex: 'my-app',
            },
          },
        ],
        defaultAuthenticationType: {
          authenticationType: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
        },
      };
      expect(getAllowedAuthTypes(config)).toEqual([
        AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
        AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT,
        AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM,
        AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
      ]);
    });
  });
});
