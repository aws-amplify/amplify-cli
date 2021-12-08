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
  aud: string;
  exp: number;
  iat: number;
  event_id?: string;
  token_use?: string;
  auth_time?: number;
  nbf?: number;
  username?: string;
  email?: string;
  groups?: string[];
  'cognito:username'?: string;
  'cognito:groups'?: string[];
};

export type IAMToken = {
  accountId: string;
  userArn: string;
  username: string;
  cognitoIdentityPoolId?: string;
  cognitoIdentityId?: string;
  cognitoIdentityAuthType?: 'authenticated' | 'unauthenticated';
  cognitoIdentityAuthProvider?: string;
};

export function extractJwtToken(authorization: string): JWTToken {
  try {
    return jwtDecode(authorization);
  } catch (_) {
    return undefined;
  }
}

export function extractIamToken(authorization: string, appSyncConfig: AmplifyAppSyncAPIConfig): IAMToken {
  const accessKeyId = authorization.includes('Credential=') ? authorization.split('Credential=')[1]?.split('/')[0] : undefined;
  if (!accessKeyId) {
    throw new Error('missing accessKeyId');
  }
  if (accessKeyId === appSyncConfig.authAccessKeyId) {
    return {
      accountId: appSyncConfig.accountId,
      userArn: `arn:aws:sts::${appSyncConfig.accountId}:${appSyncConfig.authRoleName}`,
      username: 'auth-user',
    };
  } else {
    return {
      accountId: appSyncConfig.accountId,
      userArn: `arn:aws:sts::${appSyncConfig.accountId}:${appSyncConfig.unAuthRoleName}`,
      username: 'unauth-user',
    };
  }
}

export function isValidOIDCToken(token: JWTToken, configuredAuthTypes: AmplifyAppSyncAuthenticationProviderConfig[]): boolean {
  const oidcIssuers = configuredAuthTypes
    .filter(authType => authType.authenticationType === AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT)
    .map((auth: AmplifyAppSyncAuthenticationProviderOIDCConfig) =>
      auth.openIDConnectConfig.Issuer && auth.openIDConnectConfig.Issuer.endsWith('/')
        ? auth.openIDConnectConfig.Issuer.substring(0, auth.openIDConnectConfig.Issuer.length - 1)
        : auth.openIDConnectConfig.Issuer,
    );

  const tokenIssuer = token.iss.endsWith('/') ? token.iss.substring(0, token.iss.length - 1) : token.iss;

  return oidcIssuers.length > 0 && oidcIssuers.includes(tokenIssuer);
}
export function extractHeader(headers: Record<string, string | string[]>, name: string): string {
  const headerName = Object.keys(headers).find(header => header.toLowerCase() === name.toLowerCase());
  const headerValue = headerName && headers[headerName];
  return headerValue ? (Array.isArray(headerValue) ? headerValue[0] : headerValue) : undefined;
}

export function getAllowedAuthTypes(config: AmplifyAppSyncAPIConfig): AmplifyAppSyncSimulatorAuthenticationType[] {
  return [config.defaultAuthenticationType, ...config.additionalAuthenticationProviders].map(authType => authType.authenticationType);
}
