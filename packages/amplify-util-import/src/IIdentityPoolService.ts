import { IdentityPool, IdentityPoolShortDescription } from '@aws-sdk/client-cognito-identity';

export interface IIdentityPoolService {
  listIdentityPools(): Promise<IdentityPoolShortDescription[]>;
  listIdentityPoolDetails(): Promise<IdentityPool[]>;
  getIdentityPoolRoles(
    identityPoolId: string,
  ): Promise<{ authRoleArn: string; authRoleName: string; unauthRoleArn: string; unauthRoleName: string }>;
}
