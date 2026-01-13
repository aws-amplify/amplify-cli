import { Template } from 'cloudform-types';
import { readCFNTemplate } from '@aws-amplify/amplify-cli-core';
import path from 'path';

export interface S3AccessPermission {
  bucketResource: string;
  pathPattern: string;
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
    try {
      const { cfnTemplate } = readCFNTemplate(templatePath);
      return this.parseTemplate(cfnTemplate);
    } catch {
      return [];
    }
  }

  static parseTemplate(template: Template): S3AccessPermission[] {
    const permissions: S3AccessPermission[] = [];

    if (!template.Resources) return permissions;

    for (const resource of Object.values(template.Resources)) {
      if (resource.Type === 'AWS::IAM::Policy') {
        permissions.push(...this.extractS3PermissionsFromPolicy(resource.Properties));
      }
    }

    return permissions;
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
    const permissions: S3AccessPermission[] = [];

    const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
    const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];

    const s3Actions = actions.filter((action: string) => typeof action === 'string' && action.startsWith('s3:'));

    if (s3Actions.length === 0) return permissions;

    for (const resource of resources) {
      const s3Permission = this.parseS3Resource(resource, s3Actions);
      if (s3Permission) {
        permissions.push(s3Permission);
      }
    }

    return permissions;
  }

  private static parseS3Resource(resource: any, actions: string[]): S3AccessPermission | null {
    let bucketResource: string;
    let pathPattern = '*';

    if (typeof resource === 'object' && resource['Fn::Join']) {
      const joinParts = resource['Fn::Join'];
      if (Array.isArray(joinParts) && joinParts.length === 2) {
        const [delimiter, parts] = joinParts;
        if (delimiter === '' && Array.isArray(parts)) {
          const bucketRef = parts.find((part: any) => typeof part === 'object' && part.Ref);

          if (bucketRef) {
            bucketResource = bucketRef.Ref;
            const pathPart = parts.find((part: any) => typeof part === 'string' && part.startsWith('/'));
            if (pathPart) {
              pathPattern = pathPart.substring(1);
            }
          } else {
            return null;
          }
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else if (typeof resource === 'string' && resource.startsWith('arn:aws:s3:::')) {
      const arnParts = resource.split('/');
      bucketResource = arnParts[0].replace('arn:aws:s3:::', '');
      pathPattern = arnParts.slice(1).join('/') || '*';
    } else {
      return null;
    }

    return {
      bucketResource,
      pathPattern,
      actions,
    };
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
