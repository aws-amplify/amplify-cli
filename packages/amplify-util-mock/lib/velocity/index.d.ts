import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import { GraphQLResolveInfo } from 'graphql';
import { AppSyncVTLRenderContext, AppSyncGraphQLExecutionContext, JWTToken, IAMToken } from '@aws-amplify/amplify-appsync-simulator';
type iamCognitoIdentityContext = Partial<Pick<IAMToken, 'cognitoIdentityPoolId' | 'cognitoIdentityAuthProvider' | 'cognitoIdentityAuthType' | 'cognitoIdentityId'>>;
export interface VelocityTemplateSimulatorOptions {
    authConfig: AppSyncAuthConfiguration;
}
export type AppSyncVTLContext = Partial<AppSyncVTLRenderContext>;
export type AppSyncVTLPayload = {
    context: Partial<AppSyncVTLRenderContext>;
    requestParameters: AppSyncGraphQLExecutionContext;
    info?: Partial<GraphQLResolveInfo>;
};
export declare class VelocityTemplateSimulator {
    private gqlSimulator;
    constructor(opts: VelocityTemplateSimulatorOptions);
    render(template: string, payload: AppSyncVTLPayload): {
        result: any;
        stash: any;
        args: any;
        errors: any;
        isReturn: boolean;
        hadException: boolean;
    };
}
export declare const getJWTToken: (userPool: string, username: string, email: string, groups?: string[], tokenType?: 'id' | 'access') => JWTToken;
export declare const getGenericToken: (username: string, email: string, groups?: string[], tokenType?: 'id' | 'access') => JWTToken;
export declare const getIAMToken: (username: string, identityInfo?: iamCognitoIdentityContext) => IAMToken;
export {};
//# sourceMappingURL=index.d.ts.map