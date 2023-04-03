import * as cdk from 'aws-cdk-lib';
import { $TSAny, $TSContext, $TSObject } from 'amplify-cli-core';
import { Construct } from 'constructs';
type APIGatewayPermissionSetting = 'open' | 'private' | 'protected';
type APIGateway = {
    resourceName: string;
    params?: {
        paths?: Record<string, {
            name?: string;
            lambdaFunction?: string;
            permissions?: {
                settings?: APIGatewayPermissionSetting;
                auth?: CrudOperation[];
                guest?: CrudOperation[];
            };
        }>;
    };
};
type ApiGatewayAuthStackProps = Readonly<{
    description: string;
    stackName: string;
    apiGateways: APIGateway[];
    envName: string;
}>;
export declare const APIGW_AUTH_STACK_LOGICAL_ID = "APIGatewayAuthStack";
export declare class ApiGatewayAuthStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ApiGatewayAuthStackProps);
    toCloudFormation(): $TSAny;
    private createPoliciesFromResources;
}
export declare function consolidateApiGatewayPolicies(context: $TSContext, stackName: string): Promise<$TSObject>;
export declare enum CrudOperation {
    CREATE = "create",
    READ = "read",
    UPDATE = "update",
    DELETE = "delete"
}
export declare const loadApiCliInputs: (context: $TSContext, resourceName: string, resource: $TSObject) => Promise<$TSObject | undefined>;
export {};
//# sourceMappingURL=consolidate-apigw-policies.d.ts.map