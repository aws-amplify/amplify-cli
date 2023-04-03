import { $TSContext } from 'amplify-cli-core';
import { AwsSdkConfig } from './utils/auth-types';
export interface AwsSecrets {
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
}
export declare function init(context: $TSContext): Promise<any>;
export declare function configure(context: $TSContext): Promise<any>;
export declare function onInitSuccessful(context: $TSContext): $TSContext;
export declare function loadConfiguration(context: $TSContext): Promise<AwsSecrets>;
export declare function loadConfigurationForEnv(context: $TSContext, env: string, appId?: string): Promise<AwsSdkConfig>;
export declare function resetCache(context: $TSContext): Promise<void>;
export declare function resolveRegion(): string;
export declare function getAwsConfig(context: $TSContext): Promise<AwsSdkConfig>;
//# sourceMappingURL=configuration-manager.d.ts.map