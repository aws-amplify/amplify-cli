import { $TSAny } from '@aws-amplify/amplify-cli-core';

export type AuthFlow = 'admin' | 'profile' | 'accessKeys' | 'general';
export interface AuthFlowConfig extends Partial<AwsSdkConfig> {
  type: AuthFlow;
  appId?: string;
  profileName?: string;
  useProfile?: boolean;
}

export interface AwsSdkConfig {
  accessKeyId: string;
  expiration?: Date;
  region: string;
  secretAccessKey: string;
  sessionToken?: string;
  httpOptions?: {
    agent: $TSAny;
  };
}
export interface AdminAuthPayload {
  accessToken: CognitoAccessToken;
  clockDrift: number;
  idToken: CognitoIdToken;
  IdentityPoolId: string;
  refreshToken: {
    token: string;
  };
  region: string;
}

export type AdminAuthConfig = AdminAuthPayload & { IdentityId: string };

export interface CognitoAccessToken {
  jwtToken: string;
  payload: {
    auth_time: number;
    client_id: string;
    'cognito:groups': string[];
    event_id: string;
    exp: number;
    iat: number;
    iss: string;
    jti: string;
    scope: string;
    sub: string;
    token_use: string;
    username: string;
  };
}

export interface CognitoIdToken {
  jwtToken: string;
  payload: {
    aud: string;
    auth_time: number;
    'cognito:groups': string[];
    'cognito:preferred_role': string;
    'cognito:roles': string[];
    'cognito:username': string;
    email: string;
    email_verified: boolean;
    event_id: string;
    exp: number;
    iat: number;
    iss: string;
    phone_number: string;
    phone_number_verified: boolean;
    sub: string;
    token_use: string;
    username: string;
  };
}

export interface ProviderMeta {
  ProviderName: string;
  authorize_scopes: string;
  AttributeMapping: { [key: string]: string | undefined };
}

interface ProviderCredsBase {
  ProviderName: string;
  client_id: string;
}

export interface DefaultProviderCreds extends ProviderCredsBase {
  client_secret: string;
}

export interface AppleProviderCreds extends ProviderCredsBase {
  key_id: string;
  private_key: string;
  team_id: string;
}

export type ProviderCreds = DefaultProviderCreds | AppleProviderCreds;

export interface FacebookProviderParameters {
  facebookAuthorizeScopes?: string;
  facebookAppIdUserPool?: string;
  facebookAppSecretUserPool?: string;
}

export interface GoogleProviderParameters {
  googleAuthorizeScopes?: string;
  googleAppIdUserPool?: string;
  googleAppSecretUserPool?: string;
}

export interface LoginWitAmazonProviderParameters {
  loginwithamazonAuthorizeScopes?: string;
  loginwithamazonAppIdUserPool?: string;
  loginwithamazonAppSecretUserPool?: string;
}

export interface SignInWithAppleProviderParameters {
  signinwithappleAuthorizeScopes?: string;
  signinwithappleClientIdUserPool?: string;
  signinwithappleKeyIdUserPool?: string;
  signinwithapplePrivateKeyUserPool?: string;
  signinwithappleTeamIdUserPool?: string;
}

export type ProviderParameters = FacebookProviderParameters &
  GoogleProviderParameters &
  LoginWitAmazonProviderParameters &
  SignInWithAppleProviderParameters;
