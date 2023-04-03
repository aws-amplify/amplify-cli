import { $TSContext } from 'amplify-cli-core';
export declare function init(amplifyServiceParams: any): Promise<{
    amplifyAppId: any;
    verifiedStackName: any;
    deploymentBucketName: string;
}>;
export declare function deleteEnv(context: $TSContext, envName: string, awsConfigInfo?: object): Promise<void>;
export declare function postPushCheck(context: any): Promise<void>;
export declare function storeArtifactsForAmplifyService(context: any): Promise<void>;
//# sourceMappingURL=amplify-service-manager.d.ts.map