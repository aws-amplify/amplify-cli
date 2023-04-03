import { $TSAny, $TSContext } from 'amplify-cli-core';
import { GetUserPoolMfaConfigResponse, IdentityProviderType, UserPoolClientType, UserPoolDescriptionType, UserPoolType } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { ICognitoUserPoolService } from '@aws-amplify/amplify-util-import';
export declare const createCognitoUserPoolService: (context: $TSContext, options: $TSAny) => Promise<CognitoUserPoolService>;
export declare class CognitoUserPoolService implements ICognitoUserPoolService {
    private cognito;
    private cachedUserPoolIds;
    constructor(cognito: CognitoIdentityServiceProvider);
    listUserPools(): Promise<UserPoolDescriptionType[]>;
    getUserPoolDetails(userPoolId: string): Promise<UserPoolType>;
    listUserPoolClients(userPoolId: string): Promise<UserPoolClientType[]>;
    listUserPoolIdentityProviders(userPoolId: string): Promise<IdentityProviderType[]>;
    getUserPoolMfaConfig(userPoolId: string): Promise<GetUserPoolMfaConfigResponse>;
}
//# sourceMappingURL=CognitoUserPoolService.d.ts.map