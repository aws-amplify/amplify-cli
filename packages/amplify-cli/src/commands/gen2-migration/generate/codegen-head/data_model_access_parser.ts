import { DynamoDBCloudFormationAccessParser } from './dynamodb_cfn_access_parser';
import { readCFNTemplate } from '@aws-amplify/amplify-cli-core';
import path from 'path';

export interface DataModelTableAccess {
  functionName: string;
  tableName: string;
  actions: string[];
}

export class DataModelAccessParser {
  static extractFunctionDataModelAccess(functionNames: string[]): DataModelTableAccess[] {
    const accesses: DataModelTableAccess[] = [];

    for (const functionName of functionNames) {
      const templatePath = path.join('amplify', 'backend', 'function', functionName, `${functionName}-cloudformation-template.json`);
      const { cfnTemplate } = readCFNTemplate(templatePath);

      const policy = cfnTemplate.Resources?.AmplifyResourcesPolicy;
      if (!policy || policy.Type !== 'AWS::IAM::Policy') continue;

      const statements = Array.isArray(policy.Properties.PolicyDocument.Statement)
        ? policy.Properties.PolicyDocument.Statement
        : [policy.Properties.PolicyDocument.Statement];

      for (const statement of statements) {
        if (statement.Effect === 'Allow' && statement.Resource) {
          const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
          const dynamoActions = actions.filter((action: string) => action.startsWith('dynamodb:'));

          if (dynamoActions.length === 0) continue;

          const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];

          for (const resource of resources) {
            const tableName = this.extractTableNameFromResource(resource);
            if (tableName) {
              accesses.push({
                functionName,
                tableName,
                actions: dynamoActions,
              });
            }
          }
        }
      }
    }

    return accesses;
  }

  private static extractTableNameFromResource(resource: any): string | null {
    // Handle Fn::Join with Fn::ImportValue pattern
    if (resource['Fn::Join']) {
      const parts = resource['Fn::Join'][1];
      for (const part of parts) {
        if (part['Fn::ImportValue']?.['Fn::Sub']) {
          const match = part['Fn::ImportValue']['Fn::Sub'].match(/:GetAtt:(\w+):Name/);
          return match ? match[1] : null;
        }
      }
    }
    return null;
  }
}
