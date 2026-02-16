import { Template } from 'cloudform-types';
import { readCFNTemplate } from '@aws-amplify/amplify-cli-core';
import path from 'path';

export interface S3AccessPermission {
  actions: string[];
}

const S3_ACTION_TO_GEN2_PERMISSION: Record<string, string[]> = {
  's3:GetObject': ['read'],
  's3:PutObject': ['write'],
  's3:DeleteObject': ['delete'],
  's3:ListBucket': ['read'],
};

export class S3CloudFormationAccessParser {
  static parseTemplateFile(templatePath: string): S3AccessPermission[] {
    const { cfnTemplate } = readCFNTemplate(templatePath);
    return this.parseTemplate(cfnTemplate);
  }

  static parseTemplate(template: Template): S3AccessPermission[] {
    const amplifyResourcesPolicy = template.Resources?.AmplifyResourcesPolicy;

    if (!amplifyResourcesPolicy || amplifyResourcesPolicy.Type !== 'AWS::IAM::Policy') {
      return [];
    }

    return this.extractS3PermissionsFromPolicy(amplifyResourcesPolicy.Properties);
  }

  private static extractS3PermissionsFromPolicy(policyProperties: any): S3AccessPermission[] {
    const permissions: S3AccessPermission[] = [];

    if (!policyProperties?.PolicyDocument?.Statement) return permissions;

    const statements = Array.isArray(policyProperties.PolicyDocument.Statement)
      ? policyProperties.PolicyDocument.Statement
      : [policyProperties.PolicyDocument.Statement];

    for (const statement of statements) {
      if (statement.Effect === 'Allow' && statement.Resource) {
        permissions.push(...this.extractS3PermissionsFromStatement(statement));
      }
    }

    return permissions;
  }

  private static extractS3PermissionsFromStatement(statement: any): S3AccessPermission[] {
    const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
    const s3Actions = actions.filter((action: string) => typeof action === 'string' && action.startsWith('s3:'));

    if (s3Actions.length > 0) {
      return [{ actions: s3Actions }];
    }

    return [];
  }

  static mapS3ActionsToGen2Permissions(s3Actions: string[]): string[] {
    const permissions = new Set<string>();

    for (const action of s3Actions) {
      const gen2Perms = S3_ACTION_TO_GEN2_PERMISSION[action];
      if (gen2Perms) {
        gen2Perms.forEach((perm) => permissions.add(perm));
      }
    }

    return Array.from(permissions);
  }

  static findFunctionCloudFormationTemplate(functionResourceName: string): string {
    return path.join('amplify', 'backend', 'function', functionResourceName, `${functionResourceName}-cloudformation-template.json`);
  }
}
