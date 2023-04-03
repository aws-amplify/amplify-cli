import { CognitoUserPoolConfiguration, CognitoIdentityPoolConfiguration, NoCognitoIdentityPool, CognitoOAuthConfiguration } from './add';
export interface UpdateAuthRequest {
    version: 2;
    serviceModification: CognitoServiceModification;
}
export type CognitoServiceModification = BaseCognitoServiceModification & (NoCognitoIdentityPool | ModifyCognitoIdentityPool);
export interface BaseCognitoServiceModification {
    serviceName: 'Cognito';
    userPoolModification: CognitoUserPoolModification;
}
export interface ModifyCognitoIdentityPool {
    includeIdentityPool: true;
    identityPoolModification: CognitoIdentityPoolModification;
}
export type CognitoUserPoolModification = Pick<CognitoUserPoolConfiguration, 'userPoolGroups' | 'adminQueries' | 'mfa' | 'passwordPolicy' | 'refreshTokenPeriod' | 'readAttributes' | 'writeAttributes' | 'autoVerifiedAttributes'> & {
    oAuth?: Partial<CognitoOAuthConfiguration>;
};
export type CognitoIdentityPoolModification = Pick<CognitoIdentityPoolConfiguration, 'unauthenticatedLogin' | 'identitySocialFederation'>;
//# sourceMappingURL=update.d.ts.map