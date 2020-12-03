import { Template } from 'cloudform-types';
import { GlobalSecondaryIndex, AttributeDefinition } from 'cloudform-types/types/dynamoDb/table';
import { CloudFormation } from 'aws-sdk';
import _ from 'lodash';

export interface GSIRecord {
  attributeDefinition: AttributeDefinition[];
  gsi: GlobalSecondaryIndex;
}

export const getStackParameters = async (cfnClient: CloudFormation, StackId: string): Promise<any> => {
  const apiStackInfo = await cfnClient
    .describeStacks({
      StackName: StackId,
    })
    .promise();
  return apiStackInfo.Stacks[0].Parameters.reduce((acc, param) => {
    acc[param.ParameterKey] = param.ParameterValue;
    return acc;
  }, {});
};

export const getTableNames = async (cfnClient: CloudFormation, tables: string[], StackId: string): Promise<Map<string, string>> => {
  const tableNameMap: Map<string, string> = new Map();
  const apiResources = await cfnClient
    .describeStackResources({
      StackName: StackId,
    })
    .promise();
  for (const resource of apiResources.StackResources) {
    if (tables.includes(resource.LogicalResourceId)) {
      const tableStack = await cfnClient
        .describeStacks({
          StackName: resource.PhysicalResourceId,
        })
        .promise();
      const tableName = tableStack.Stacks[0].Outputs.reduce((acc, out) => {
        if (out.OutputKey === `GetAtt${resource.LogicalResourceId}TableName`) {
          acc.push(out.OutputValue);
        }
        return acc;
      }, []);
      tableNameMap.set(resource.LogicalResourceId, tableName[0]);
    }
  }
  return tableNameMap;
};

export class TemplateState {
  private changes: { [key: string]: string[] } = {};

  public has(key: string) {
    return Boolean(key in this.changes);
  }

  public isEmpty(): Boolean {
    return !Object.keys(this.changes).length;
  }

  public get(key: string): string[] {
    return this.changes[key];
  }

  public getLatest(key: string): Template | null {
    if (this.changes[key]) {
      const length = this.changes[key].length;
      return length ? JSON.parse(this.changes[key][length - 1]) : null;
    }
    return null;
  }

  public pop(key: string): Template {
    const template = this.changes[key].shift();
    if (_.isEmpty(this.changes[key])) {
      delete this.changes[key];
    }
    return JSON.parse(template);
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
