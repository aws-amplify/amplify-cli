import { AmplifyAppSyncAPIConfig, AmplifyAppSyncAuthenticationProviderConfig, AmplifyAppSyncSimulatorAuthenticationType } from '../../type-definition';
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
export declare function extractJwtToken(authorization: string): JWTToken;
export declare function extractIamToken(authorization: string, appSyncConfig: AmplifyAppSyncAPIConfig): IAMToken;
export declare function isValidOIDCToken(token: JWTToken, configuredAuthTypes: AmplifyAppSyncAuthenticationProviderConfig[]): boolean;
export declare function extractHeader(headers: Record<string, string | string[]>, name: string): string;
export declare function getAllowedAuthTypes(config: AmplifyAppSyncAPIConfig): AmplifyAppSyncSimulatorAuthenticationType[];
//# sourceMappingURL=helpers.d.ts.map