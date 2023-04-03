import { IdentityPool, IdentityPoolShortDescription } from 'aws-sdk/clients/cognitoidentity';
export interface IIdentityPoolService {
    listIdentityPools(): Promise<IdentityPoolShortDescription[]>;
    listIdentityPoolDetails(): Promise<IdentityPool[]>;
    getIdentityPoolRoles(identityPoolId: string): Promise<{
        authRoleArn: string;
        authRoleName: string;
        unauthRoleArn: string;
        unauthRoleName: string;
    }>;
}
//# sourceMappingURL=IIdentityPoolService.d.ts.map