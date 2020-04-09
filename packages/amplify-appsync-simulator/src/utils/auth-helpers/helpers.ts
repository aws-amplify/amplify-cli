import jwtDecode from 'jwt-decode';
import {
  AmplifyAppSyncAPIConfig,
  AmplifyAppSyncAuthenticationProviderConfig,
  AmplifyAppSyncAuthenticationProviderOIDCConfig,
  AmplifyAppSyncSimulatorAuthenticationType,
} from '../../type-definition';

export type JWTToken = {
  iss: string;
  sub: string;
  exp: number;
  aud: string;
  iat: number;
  nbf: number;
  username?: string;
  'cognito:username'?: string;
};

export function extractJwtToken(authorization: string): JWTToken {
  try {
    return jwtDecode(authorization);
  } catch (_) {
    return undefined;
  }
}

export function isValidOIDCToken(token: JWTToken, configuredAuthTypes: AmplifyAppSyncAuthenticationProviderConfig[]): boolean {
  const oidcIssuers = configuredAuthTypes
    .filter(authType => authType.authenticationType === AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT)
    .map((auth: AmplifyAppSyncAuthenticationProviderOIDCConfig) => auth.openIDConnectConfig.Issuer);

  return oidcIssuers.length > 0 && oidcIssuers.includes(token.iss);
}
export function extractHeader(headers: Record<string, string | string[]>, name: string): string {
  const headerName = Object.keys(headers).find(header => header.toLowerCase() === name.toLowerCase());
  const headerValue = headerName && headers[headerName];
  return headerValue ? (Array.isArray(headerValue) ? headerValue[0] : headerValue) : undefined;
}

export function getAllowedAuthTypes(config: AmplifyAppSyncAPIConfig): AmplifyAppSyncSimulatorAuthenticationType[] {
  return [config.defaultAuthenticationType, ...config.additionalAuthenticationProviders].map(authType => authType.authenticationType);
}
