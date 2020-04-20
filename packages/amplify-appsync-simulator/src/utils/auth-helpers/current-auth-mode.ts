import { AmplifyAppSyncAPIConfig, AmplifyAppSyncSimulatorAuthenticationType } from '../../type-definition';
import { extractHeader, getAllowedAuthTypes, isValidOIDCToken, extractJwtToken } from './helpers';

export function getAuthorizationMode(
  headers: Record<string, string | string[]>,
  appSyncConfig: AmplifyAppSyncAPIConfig,
): AmplifyAppSyncSimulatorAuthenticationType {
  const apiKey = extractHeader(headers, 'x-api-key');
  const rawAuthHeader = extractHeader(headers, 'Authorization');
  const authorization = Array.isArray(rawAuthHeader) ? rawAuthHeader[0] : rawAuthHeader;
  const jwtToken = extractJwtToken(authorization);
  const allowedAuthTypes = getAllowedAuthTypes(appSyncConfig);
  const isApiKeyAllowed = allowedAuthTypes.includes(AmplifyAppSyncSimulatorAuthenticationType.API_KEY);
  const isIamAllowed = allowedAuthTypes.includes(AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM);
  const isCupAllowed = allowedAuthTypes.includes(AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS);
  const isOidcAllowed = allowedAuthTypes.includes(AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT);

  if (isApiKeyAllowed) {
    if (apiKey) {
      if (appSyncConfig.apiKey === apiKey) {
        return AmplifyAppSyncSimulatorAuthenticationType.API_KEY;
      }

      throw new Error('UnauthorizedException: Invalid API key');
    }
  }

  if (authorization) {
    if (isIamAllowed) {
      const isSignatureV4Token = authorization.startsWith('AWS4-HMAC-SHA256');
      if (isSignatureV4Token) {
        return AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM;
      }
    }

    if (jwtToken) {
      if (isCupAllowed) {
        const isCupToken = jwtToken.iss.startsWith('https://cognito-idp.');
        if (isCupToken) {
          return AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS;
        }
      }

      if (isOidcAllowed) {
        const isOidcToken = isValidOIDCToken(jwtToken, [
          appSyncConfig.defaultAuthenticationType,
          ...appSyncConfig.additionalAuthenticationProviders,
        ]);
        if (isOidcToken) {
          return AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT;
        }
      }
    }
    throw new Error('UnauthorizedException: Invalid JWT token');
  }

  throw new Error('UnauthorizedException: Missing authorization');
}
