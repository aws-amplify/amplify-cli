import { $TSAny } from '@aws-amplify/amplify-cli-core';
import { NodeHttpHandler } from '@smithy/node-http-handler';

export type AuthFlow = 'admin' | 'profile' | 'accessKeys' | 'general';
export interface AuthFlowConfig extends Partial<AwsSdkConfig> {
  type: AuthFlow;
  appId?: string;
  profileName?: string;
  useProfile?: boolean;
}

export interface AwsSdkConfig {
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
    expiration?: Date;
  };
  region: string;
  requestHandler?: NodeHttpHandler;
  // TO DO: remove eventually, V2 style of handling proxies
  httpOptions?: {
    agent: $TSAny;
  };
}
export interface legacyAwsSdkConfig {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  expiration?: Date;
  region: string;
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
