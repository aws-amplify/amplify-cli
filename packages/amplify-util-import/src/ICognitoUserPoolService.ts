import {
  GetUserPoolMfaConfigResponse,
  IdentityProviderType,
  UserPoolDescriptionType,
  UserPoolType,
  UserPoolClientType,
} from '@aws-sdk/client-cognito-identity-provider';

export interface ICognitoUserPoolService {
  listUserPools(): Promise<UserPoolDescriptionType[]>;
  getUserPoolDetails(userPoolId: string): Promise<UserPoolType>;
  listUserPoolClients(userPoolId: string): Promise<UserPoolClientType[]>;
  listUserPoolIdentityProviders(userPoolId: string): Promise<IdentityProviderType[]>;
  getUserPoolMfaConfig(userPoolId: string): Promise<GetUserPoolMfaConfigResponse>;
}
