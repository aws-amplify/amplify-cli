import { Template } from 'cloudform-types';
import { readCFNTemplate } from '@aws-amplify/amplify-cli-core';
import path from 'path';

export interface KinesisAccessPermission {
  actions: string[];
}

export class KinesisCloudFormationAccessParser {
  static parseTemplateFile(templatePath: string): KinesisAccessPermission[] {
    const { cfnTemplate } = readCFNTemplate(templatePath);
    return this.parseTemplate(cfnTemplate);
  }

  static parseTemplate(template: Template): KinesisAccessPermission[] {
    const amplifyResourcesPolicy = template.Resources?.AmplifyResourcesPolicy;

    if (!amplifyResourcesPolicy || amplifyResourcesPolicy.Type !== 'AWS::IAM::Policy') {
      return [];
    }

    return this.extractKinesisPermissionsFromPolicy(amplifyResourcesPolicy.Properties);
  }

  private static extractKinesisPermissionsFromPolicy(policyProperties: any): KinesisAccessPermission[] {
    const permissions: KinesisAccessPermission[] = [];

    if (!policyProperties?.PolicyDocument?.Statement) return permissions;

    const statements = Array.isArray(policyProperties.PolicyDocument.Statement)
      ? policyProperties.PolicyDocument.Statement
      : [policyProperties.PolicyDocument.Statement];

    for (const statement of statements) {
      if (statement.Effect === 'Allow') {
        const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
        const kinesisActions = actions.filter((action: string) => typeof action === 'string' && action.startsWith('kinesis:'));

        if (kinesisActions.length > 0) {
          permissions.push({ actions: kinesisActions });
        }
      }
    }

    return permissions;
  }

  static findFunctionCloudFormationTemplate(functionResourceName: string): string {
    return path.join('amplify', 'backend', 'function', functionResourceName, `${functionResourceName}-cloudformation-template.json`);
  }
}

export interface FunctionKinesisAccess {
  functionName: string;
  actions: string[];
}

export const extractFunctionKinesisAccess = (functionNames: string[]): FunctionKinesisAccess[] => {
  const functionAccess: FunctionKinesisAccess[] = [];

  for (const functionName of functionNames) {
    const templatePath = KinesisCloudFormationAccessParser.findFunctionCloudFormationTemplate(functionName);
    const kinesisPermissions = KinesisCloudFormationAccessParser.parseTemplateFile(templatePath);

    const allActions = new Set<string>();
    for (const permission of kinesisPermissions) {
      for (const action of permission.actions) {
        allActions.add(action);
      }
    }

    if (allActions.size > 0) {
      functionAccess.push({
        functionName,
        actions: Array.from(allActions),
      });
    }
  }

  return functionAccess;
};
