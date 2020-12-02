import { CognitoUserPoolConfiguration, CognitoIdentityPoolConfiguration, NoCognitoIdentityPool, CognitoOAuthConfiguration } from './add';

export interface UpdateAuthRequest {
  version: 1;
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

export type CognitoUserPoolModification = Pick<
  CognitoUserPoolConfiguration,
  | 'userPoolGroups'
  | 'adminQueries'
  | 'mfa'
  | 'passwordPolicy'
  | 'passwordRecovery'
  | 'refreshTokenPeriod'
  | 'readAttributes'
  | 'writeAttributes'
  | 'addUserToGroup'
  | 'emailBlacklist'
  | 'emailWhitelist'
  | 'customAuthScaffolding'
> & { oAuth?: Partial<CognitoOAuthConfiguration> };
export type CognitoIdentityPoolModification = Pick<CognitoIdentityPoolConfiguration, 'unauthenticatedLogin' | 'identitySocialFederation'>;
