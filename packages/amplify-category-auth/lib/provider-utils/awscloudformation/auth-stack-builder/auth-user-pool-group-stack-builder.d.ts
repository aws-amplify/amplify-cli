import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { CfnUserPoolGroup } from 'aws-cdk-lib/aws-cognito';
import { AmplifyUserPoolGroupStackTemplate } from '@aws-amplify/cli-extensibility-helper';
import { Construct } from 'constructs';
import { AmplifyUserPoolGroupStackOptions } from './user-pool-group-stack-transform';
export type AmplifyAuthCognitoStackProps = {
    synthesizer: cdk.IStackSynthesizer;
};
export declare class AmplifyUserPoolGroupStack extends cdk.Stack implements AmplifyUserPoolGroupStackTemplate {
    _scope: Construct;
    private _cfnParameterMap;
    private _cfnConditionMap;
    userPoolGroup: Record<string, CfnUserPoolGroup>;
    userPoolGroupRole: Record<string, iam.CfnRole>;
    roleMapCustomResource?: cdk.CustomResource;
    roleMapLambdaFunction?: lambda.CfnFunction;
    lambdaExecutionRole?: iam.CfnRole;
    constructor(scope: Construct, id: string, props: AmplifyAuthCognitoStackProps);
    getCfnOutput(): cdk.CfnOutput;
    getCfnMapping(): cdk.CfnMapping;
    addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void;
    addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void;
    addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void;
    addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void;
    addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void;
    getCfnParameter(logicalId: string): cdk.CfnParameter;
    getCfnCondition(logicalId: string): cdk.CfnCondition;
    renderCloudFormationTemplate: () => string;
    generateUserPoolGroupResources: (props: AmplifyUserPoolGroupStackOptions) => Promise<void>;
}
export declare class AmplifyUserPoolGroupStackOutputs extends cdk.Stack {
    constructor(scope: Construct, id: string, props: AmplifyAuthCognitoStackProps);
    getCfnParameter(): cdk.CfnParameter;
    getCfnOutput(): cdk.CfnOutput;
    getCfnMapping(): cdk.CfnMapping;
    getCfnCondition(): cdk.CfnCondition;
    addCfnParameter(): void;
    addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void;
    addCfnMapping(): void;
    addCfnCondition(): void;
    addCfnResource(): void;
    renderCloudFormationTemplate: () => string;
}
//# sourceMappingURL=auth-user-pool-group-stack-builder.d.ts.map