import { $TSAny } from '@aws-amplify/amplify-cli-core';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AuthTriggerConnection, AuthTriggerPermissions, CognitoStackOptions } from '../service-walkthrough-types/cognito-user-input-types';
type CustomResourceAuthStackProps = Readonly<{
    description: string;
    authTriggerConnections: AuthTriggerConnection[];
    enableSnsRole: boolean;
    permissions?: AuthTriggerPermissions[];
}>;
export declare class CustomResourceAuthStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: CustomResourceAuthStackProps);
    toCloudFormation: () => $TSAny;
}
export declare const generateNestedAuthTriggerTemplate: (category: string, resourceName: string, request: CognitoStackOptions) => Promise<void>;
export declare const createCustomResourceForAuthTrigger: (authTriggerConnections: AuthTriggerConnection[], enableSnsRole: boolean, permissions?: AuthTriggerPermissions[]) => Promise<$TSAny>;
export {};
//# sourceMappingURL=generate-auth-trigger-template.d.ts.map