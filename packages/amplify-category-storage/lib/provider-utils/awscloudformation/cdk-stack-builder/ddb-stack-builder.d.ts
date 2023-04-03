import * as cdk from 'aws-cdk-lib';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { AmplifyDDBResourceTemplate } from '@aws-amplify/cli-extensibility-helper';
import { DynamoDBCLIInputs } from '../service-walkthrough-types/dynamoDB-user-input-types';
export declare class AmplifyDDBResourceStack extends cdk.Stack implements AmplifyDDBResourceTemplate {
    _scope: Construct;
    dynamoDBTable: ddb.CfnTable;
    _props: DynamoDBCLIInputs;
    _cfnParameterMap: Map<string, cdk.CfnParameter>;
    constructor(scope: Construct, id: string, props: DynamoDBCLIInputs);
    addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void;
    addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void;
    addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void;
    addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void;
    addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void;
    generateStackResources: () => Promise<void>;
    renderCloudFormationTemplate: () => string;
}
//# sourceMappingURL=ddb-stack-builder.d.ts.map