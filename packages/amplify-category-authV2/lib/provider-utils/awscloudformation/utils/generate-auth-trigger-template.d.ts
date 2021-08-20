import * as cdk from '@aws-cdk/core';
import { AuthTriggerConnection, ServiceQuestionsResult } from '../service-walkthrough-types';
declare type CustomResourceAuthStackProps = Readonly<{
  description: string;
  authTriggerConnections: AuthTriggerConnection[];
}>;
export declare class CustomResourceAuthStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: CustomResourceAuthStackProps);
  toCloudFormation(): any;
}
export declare function generateNestedAuthTriggerTemplate(category: string, request: ServiceQuestionsResult): Promise<void>;
export {};
//# sourceMappingURL=generate-auth-trigger-template.d.ts.map
