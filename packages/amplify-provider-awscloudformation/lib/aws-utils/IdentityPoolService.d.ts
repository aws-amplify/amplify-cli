import { $TSAny, $TSContext } from 'amplify-cli-core';
import { IIdentityPoolService } from '@aws-amplify/amplify-util-import';
import { CognitoIdentity } from 'aws-sdk';
import { IdentityPool, IdentityPoolShortDescription } from 'aws-sdk/clients/cognitoidentity';
export declare const createIdentityPoolService: (context: $TSContext, options: $TSAny) => Promise<IdentityPoolService>;
export declare class IdentityPoolService implements IIdentityPoolService {
    private cognitoIdentity;
    private cachedIdentityPoolIds;
    private cachedIdentityPoolDetails;
    constructor(cognitoIdentity: CognitoIdentity);
    listIdentityPools(): Promise<IdentityPoolShortDescription[]>;
    listIdentityPoolDetails(): Promise<IdentityPool[]>;
    getIdentityPoolRoles(identityPoolId: string): Promise<{
        authRoleArn: string;
        authRoleName: string;
        unauthRoleArn: string;
        unauthRoleName: string;
    }>;
    private getResourceNameFromArn;
}
//# sourceMappingURL=IdentityPoolService.d.ts.map