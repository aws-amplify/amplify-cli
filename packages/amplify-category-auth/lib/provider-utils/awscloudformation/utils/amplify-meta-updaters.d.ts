import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { AuthParameters } from '../import/types';
type FrontEndConfig = {
    socialProviders: string[];
    usernameAttributes: string[];
    signupAttributes: string[];
    passwordProtectionSettings: {
        passwordPolicyMinLength: number | undefined;
        passwordPolicyCharacters: string[];
    };
    mfaConfiguration: string | undefined;
    mfaTypes: string[];
    verificationMechanisms: string[];
};
export declare const getPostAddAuthMetaUpdater: (context: $TSContext, resultMetadata: {
    service: string;
    providerName: string;
}) => (resourceName: string) => string;
export declare const getPostUpdateAuthMetaUpdater: (context: $TSContext) => (resourceName: string) => Promise<string>;
export declare const getFrontendConfig: (authParameters: AuthParameters) => FrontEndConfig;
export {};
//# sourceMappingURL=amplify-meta-updaters.d.ts.map