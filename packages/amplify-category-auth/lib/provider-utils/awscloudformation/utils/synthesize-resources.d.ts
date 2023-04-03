import { $TSAny, $TSContext, $TSObject } from '@aws-amplify/amplify-cli-core';
import { CognitoConfiguration } from '../service-walkthrough-types/awsCognito-user-input-types';
export declare const getResourceSynthesizer: (context: $TSContext, request: Readonly<CognitoConfiguration>) => Promise<CognitoConfiguration>;
export declare const getResourceUpdater: (context: $TSContext, request: Readonly<CognitoConfiguration>) => Promise<CognitoConfiguration>;
export declare const copyCfnTemplate: (context: $TSContext, category: string, options: $TSObject, cfnFilename: string) => Promise<$TSAny>;
export declare const saveResourceParameters: (context: $TSContext, providerName: string, category: string, resource: string, params: $TSObject, envSpecificParams?: $TSAny[]) => void;
export declare const removeDeprecatedProps: (props: $TSObject) => $TSObject;
export declare const createUserPoolGroups: (context: $TSContext, resourceName: string, userPoolGroupList?: string[]) => Promise<void>;
export declare const updateUserPoolGroups: (context: $TSContext, resourceName: string, userPoolGroupList?: string[]) => Promise<void>;
export declare const createAdminAuthFunction: (context: $TSContext, authResourceName: string, functionName: string, adminGroup: string, operation: 'update' | 'add') => Promise<void>;
//# sourceMappingURL=synthesize-resources.d.ts.map