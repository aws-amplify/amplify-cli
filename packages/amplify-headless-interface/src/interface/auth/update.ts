import { CognitoUserPoolConfiguration, CognitoIdentityPoolConfiguration, NoCognitoIdentityPool, CognitoOAuthConfiguration } from './add';

/**
 * Defines the payload expected by `amplify update auth --headless`
 */
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

/**
 * A subset of properties from CognitoUserPoolConfiguration that can be modified.
 *
 * Each field will overwrite the entire previous configuration of that field, but omitted fields will not be removed.
 * For example, adding auth with
 *
 * {
 *   readAttributes: ['EMAIL', 'NAME', 'PHONE_NUMBER'],
 *   passwordPolicy: {
 *     minimumLength: 10,
 *     additionalConstraints: [
 *       REQUIRE_LOWERCASE, REQUIRE_UPPERCASE
 *     ]
 *   }
 * }
 *
 * and then updating auth with
 *
 * {
 *   passwordPolicy: {
 *     minimumLength: 8
 *   }
 * }
 *
 * will overwrite the entire passwordPolicy (removing the lowercase and uppercase constraints)
 * but will leave the readAttributes unaffected.
 *
 * However, the oAuth field is treated slightly differently:
 *   Omitting the oAuth field entirely will leave oAuth configuration unchanged.
 *   Setting oAuth to {} (an empty object) will remove oAuth from the auth resource.
 *   Including a non-empty oAuth configuration will overwrite the previous oAuth configuration.
 */
export type CognitoUserPoolModification = Pick<
  CognitoUserPoolConfiguration,
  | 'userPoolGroups'
  | 'adminQueries'
  | 'mfa'
  | 'passwordPolicy'
  | 'refreshTokenPeriod'
  | 'readAttributes'
  | 'writeAttributes'
  | 'autoVerifiedAttributes'
> & { oAuth?: Partial<CognitoOAuthConfiguration> };
export type CognitoIdentityPoolModification = Pick<CognitoIdentityPoolConfiguration, 'unauthenticatedLogin' | 'identitySocialFederation'>;
