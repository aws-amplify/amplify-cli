import * as cdk from '@aws-cdk/core';
import * as ddb from '@aws-cdk/aws-dynamodb';

export interface AmplifyDDBResourceTemplate {
  dynamoDBTable?: ddb.CfnTable;

  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void;
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void;
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void;
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void;
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void;
}

export interface AmplifyDDBResourceInputParameters {
  tableName: string;
  partitionKeyName: string;
  partitionKeyType: string;
  sortKeyName?: string;
  sortKeyType?: string;
}
