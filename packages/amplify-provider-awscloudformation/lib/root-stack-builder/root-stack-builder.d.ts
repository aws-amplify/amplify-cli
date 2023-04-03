import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { AmplifyRootStackTemplate } from '@aws-amplify/cli-extensibility-helper';
import { IStackSynthesizer } from 'aws-cdk-lib';
import { Construct } from 'constructs';
export type AmplifyRootStackProps = {
    synthesizer: IStackSynthesizer;
};
export declare class AmplifyRootStack extends cdk.Stack implements AmplifyRootStackTemplate {
    _scope: Construct;
    deploymentBucket: s3.CfnBucket;
    authRole: iam.CfnRole;
    unauthRole: iam.CfnRole;
    private _cfnParameterMap;
    constructor(scope: Construct, id: string, props: AmplifyRootStackProps);
    addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void;
    addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void;
    addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void;
    addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void;
    addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void;
    getCfnParameter(logicalId: string): cdk.CfnParameter;
    generateRootStackResources: () => Promise<void>;
    renderCloudFormationTemplate: () => string;
}
export declare class AmplifyRootStackOutputs extends cdk.Stack implements AmplifyRootStackTemplate {
    deploymentBucket?: s3.CfnBucket;
    authRole?: iam.CfnRole;
    unauthRole?: iam.CfnRole;
    addCfnParameter(): void;
    addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void;
    addCfnMapping(): void;
    addCfnCondition(): void;
    addCfnResource(): void;
    renderCloudFormationTemplate: () => string;
}
//# sourceMappingURL=root-stack-builder.d.ts.map