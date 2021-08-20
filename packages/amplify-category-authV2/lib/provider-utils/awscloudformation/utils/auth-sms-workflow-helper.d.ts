import { $TSContext } from 'amplify-cli-core';
import { ServiceQuestionsResult } from '../service-walkthrough-types';
export declare type UserPoolMessageConfiguration = {
  mfaConfiguration?: string;
  mfaTypes?: string[];
  usernameAttributes?: string[];
};
export declare const doesConfigurationIncludeSMS: (request: ServiceQuestionsResult) => boolean;
export declare const loadResourceParameters: (context: $TSContext, resourceName: string) => UserPoolMessageConfiguration;
export declare const loadImportedAuthParameters: (context: $TSContext, userPoolName: string) => Promise<UserPoolMessageConfiguration>;
//# sourceMappingURL=auth-sms-workflow-helper.d.ts.map
