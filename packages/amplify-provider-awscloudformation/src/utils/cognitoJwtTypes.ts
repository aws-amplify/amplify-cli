export interface TokenPayload {
  accessToken: CognitoAccessToken;
  clockDrift: number;
  idToken: CognitoIdToken;
  IdentityId?: string;
  IdentityPoolId: string;
  refreshToken: {
    token: string;
  };
  region: string;
}

export interface CognitoAccessToken {
  jwtToken: string;
  payload: {
    auth_time: number;
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
