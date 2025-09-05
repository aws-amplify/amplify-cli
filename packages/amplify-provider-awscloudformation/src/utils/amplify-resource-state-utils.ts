import { Template } from 'cloudform-types';
import { GlobalSecondaryIndex, AttributeDefinition } from 'cloudform-types/types/dynamoDb/table';
import { CloudFormationClient, DescribeStacksCommand, DescribeStackResourcesCommand, Capability } from '@aws-sdk/client-cloudformation';
import _ from 'lodash';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';

export interface GSIRecord {
  attributeDefinition: AttributeDefinition[];
  gsi: GlobalSecondaryIndex;
}
/**
 * Use previously deployed variables
 */
export interface DeploymentRecord {
  parameters?: Record<string, string>;
  capabilities?: Capability[];
}

export const getPreviousDeploymentRecord = async (cfnClient: CloudFormationClient, stackId: string): Promise<DeploymentRecord> => {
  const depRecord: DeploymentRecord = {};
  const describeStacksCommand = new DescribeStacksCommand({
    StackName: stackId,
  });
  const apiStackInfo = await cfnClient.send(describeStacksCommand);
  depRecord.parameters = apiStackInfo.Stacks[0].Parameters.reduce((acc, param) => {
    acc[param.ParameterKey] = param.ParameterValue;
    return acc;
  }, {}) as Record<string, string>;
  depRecord.capabilities = apiStackInfo.Stacks[0].Capabilities;
  return depRecord;
};

export const getTableNames = async (cfnClient: CloudFormationClient, tables: string[], StackId: string): Promise<Map<string, string>> => {
  const tableNameMap: Map<string, string> = new Map();
  const describeStackResourcesCommand = new DescribeStackResourcesCommand({
    StackName: StackId,
  });
  const apiResources = await cfnClient.send(describeStackResourcesCommand);
  for (const resource of apiResources.StackResources) {
    if (tables.includes(resource.LogicalResourceId)) {
      const describeStacksCommand = new DescribeStacksCommand({
        StackName: resource.PhysicalResourceId,
      });
      const tableStack = await cfnClient.send(describeStacksCommand);
      if (tableStack.Stacks[0].Outputs) {
        const tableName = tableStack.Stacks[0].Outputs.reduce((acc, out) => {
          if (out.OutputKey === `GetAtt${resource.LogicalResourceId}TableName`) {
            acc.push(out.OutputValue);
          }
          return acc;
        }, []);
        tableNameMap.set(resource.LogicalResourceId, tableName[0]);
      }
    }
  }
  return tableNameMap;
};

export class TemplateState {
  private changes: { [key: string]: string[] } = {};

  public has(key: string) {
    return Boolean(key in this.changes);
  }

  public isEmpty(): boolean {
    return !Object.keys(this.changes).length;
  }

  public get(key: string): string[] {
    return this.changes[key];
  }

  public getLatest(key: string): Template | null {
    if (this.changes[key]) {
      const length = this.changes[key].length;
      return length ? JSONUtilities.parse(this.changes[key][length - 1]) : null;
    }
    return null;
  }

  public pop(key: string): Template {
    const template = this.changes[key].shift();
    if (_.isEmpty(this.changes[key])) {
      delete this.changes[key];
    }
    return JSONUtilities.parse(template);
  }

  public add(key: string, val: string): void {
    if (!(key in this.changes)) {
      this.changes[key] = [];
    }
    this.changes[key].push(val);
  }

  public getChangeCount(key: string): number {
    return this.changes[key].length;
  }

  public getKeys(): Array<string> {
    return Object.keys(this.changes);
  }
}
