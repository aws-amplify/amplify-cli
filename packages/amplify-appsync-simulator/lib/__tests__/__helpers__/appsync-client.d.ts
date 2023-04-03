import { AmplifyAppSyncSimulator, AmplifyAppSyncSimulatorAuthenticationType } from '../../';
export declare const gql: (chunks: TemplateStringsArray, ...variables: unknown[]) => string;
interface AppSyncSimulatorAuthentication {
    type: AmplifyAppSyncSimulatorAuthenticationType;
}
interface AppSyncSimulatorIAMAuthentication extends AppSyncSimulatorAuthentication {
    type: AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM;
}
interface AppSyncSimulatorApiKeyAuthentication extends AppSyncSimulatorAuthentication {
    type: AmplifyAppSyncSimulatorAuthenticationType.API_KEY;
    apiKey: string;
}
interface AppSyncSimulatorCognitoKeyAuthentication extends AppSyncSimulatorAuthentication {
    type: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS;
    username: string;
    groups?: readonly string[];
}
export declare function appSyncClient<ResponseDataType = unknown, VarsType = Record<string, unknown>>({ appSync, query, variables, auth, }: {
    appSync: AmplifyAppSyncSimulator;
    query: string;
    variables?: VarsType;
    auth?: AppSyncSimulatorIAMAuthentication | AppSyncSimulatorApiKeyAuthentication | AppSyncSimulatorCognitoKeyAuthentication;
}): Promise<ResponseDataType>;
export {};
//# sourceMappingURL=appsync-client.d.ts.map