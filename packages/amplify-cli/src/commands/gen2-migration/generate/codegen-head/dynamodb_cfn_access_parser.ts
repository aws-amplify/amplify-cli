import { Template } from 'cloudform-types';
import { readCFNTemplate } from '@aws-amplify/amplify-cli-core';
import path from 'path';

export interface DynamoDBAccessPermission {
  tableResource: string;
  actions: string[];
}

const DYNAMODB_ACTION_TO_GEN2_PERMISSION: Record<string, string[]> = {
  'dynamodb:GetItem': ['read'],
  'dynamodb:PutItem': ['write'],
  'dynamodb:UpdateItem': ['write'],
  'dynamodb:DeleteItem': ['delete'],
  'dynamodb:Query': ['read'],
  'dynamodb:Scan': ['read'],
  'dynamodb:BatchGetItem': ['read'],
  'dynamodb:BatchWriteItem': ['write'],
};

export class DynamoDBCloudFormationAccessParser {
  static parseTemplateFile(templatePath: string): DynamoDBAccessPermission[] {
    try {
      const { cfnTemplate } = readCFNTemplate(templatePath);
      return this.parseTemplate(cfnTemplate);
    } catch {
      return [];
    }
  }

  static parseTemplate(template: Template): DynamoDBAccessPermission[] {
    const permissions: DynamoDBAccessPermission[] = [];

    if (!template.Resources) return permissions;

    for (const resource of Object.values(template.Resources)) {
      if (resource.Type === 'AWS::IAM::Policy') {
        permissions.push(...this.extractDynamoDBPermissionsFromPolicy(resource.Properties));
      }
    }

    return permissions;
  }

  private static extractDynamoDBPermissionsFromPolicy(policyProperties: any): DynamoDBAccessPermission[] {
    const permissions: DynamoDBAccessPermission[] = [];

    if (!policyProperties?.PolicyDocument?.Statement) return permissions;

    const statements = Array.isArray(policyProperties.PolicyDocument.Statement)
      ? policyProperties.PolicyDocument.Statement
      : [policyProperties.PolicyDocument.Statement];

    for (const statement of statements) {
      if (statement.Effect === 'Allow' && statement.Resource) {
        permissions.push(...this.extractDynamoDBPermissionsFromStatement(statement));
      }
    }

    return permissions;
  }

  private static extractDynamoDBPermissionsFromStatement(statement: any): DynamoDBAccessPermission[] {
    const permissions: DynamoDBAccessPermission[] = [];

    const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
    const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];

    const dynamoActions = actions.filter((action: string) => typeof action === 'string' && action.startsWith('dynamodb:'));

    if (dynamoActions.length === 0) return permissions;

    for (const resource of resources) {
      const dynamoPermission = this.parseDynamoDBResource(resource, dynamoActions);
      if (dynamoPermission) {
        permissions.push(dynamoPermission);
      }
    }

    return permissions;
  }

  private static parseDynamoDBResource(resource: any, actions: string[]): DynamoDBAccessPermission | null {
    let tableResource: string;

    if (typeof resource === 'object' && resource['Fn::Join']) {
      const joinParts = resource['Fn::Join'];
      if (Array.isArray(joinParts) && joinParts.length === 2) {
        const [, parts] = joinParts;
        if (Array.isArray(parts)) {
          const tableRef = parts.find((part: any) => typeof part === 'object' && part.Ref);
          if (tableRef) {
            tableResource = tableRef.Ref;
          } else {
            return null;
          }
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else if (typeof resource === 'object' && resource.Ref) {
      // Handle direct CloudFormation Ref parameters like {"Ref": "storagecountsTableArn"}
      tableResource = resource.Ref;
    } else if (typeof resource === 'string' && resource.includes('dynamodb')) {
      const arnParts = resource.split('/');
      if (arnParts.length >= 2) {
        tableResource = arnParts[1];
      } else {
        return null;
      }
    } else {
      return null;
    }

    return {
      tableResource,
      actions,
    };
  }

  static mapDynamoDBActionsToGen2Permissions(dynamoActions: string[]): string[] {
    const permissions = new Set<string>();

    for (const action of dynamoActions) {
      const gen2Perms = DYNAMODB_ACTION_TO_GEN2_PERMISSION[action];
      if (gen2Perms) {
        gen2Perms.forEach((perm) => permissions.add(perm));
      }
    }

    return Array.from(permissions);
  }

  static findFunctionCloudFormationTemplate(functionResourceName: string): string | null {
    const templatePath = path.join(
      'amplify',
      'backend',
      'function',
      functionResourceName,
      `${functionResourceName}-cloudformation-template.json`,
    );

    try {
      if (require('fs').existsSync(templatePath)) {
        return templatePath;
      }
    } catch {
      // Template doesn't exist
    }

    return null;
  }
}
