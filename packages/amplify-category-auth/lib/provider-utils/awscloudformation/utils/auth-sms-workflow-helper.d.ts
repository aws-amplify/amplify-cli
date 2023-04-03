import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { CognitoConfiguration } from '../service-walkthrough-types/awsCognito-user-input-types';
import { ServiceQuestionHeadlessResult } from '../service-walkthrough-types/cognito-user-input-types';
export type UserPoolMessageConfiguration = {
    mfaConfiguration?: string;
    mfaTypes?: string[];
    usernameAttributes?: string[];
};
export declare const doesConfigurationIncludeSMS: (request: CognitoConfiguration | ServiceQuestionHeadlessResult) => boolean;
export declare const loadResourceParameters: (context: $TSContext, authResourceName: string) => Promise<UserPoolMessageConfiguration>;
export declare const loadImportedAuthParameters: (context: $TSContext, userPoolName: string) => Promise<UserPoolMessageConfiguration>;
//# sourceMappingURL=auth-sms-workflow-helper.d.ts.map