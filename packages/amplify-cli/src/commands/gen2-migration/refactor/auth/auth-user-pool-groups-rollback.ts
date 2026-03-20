import { CFNResource } from '../../cfn-template';
import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { USER_POOL_GROUP_TYPE } from './auth-user-pool-groups-forward';

/**
 * Rollback refactorer for the auth:UserPoolGroups resource.
 *
 * Moves user pool groups auth resources resources from Gen2 back to Gen1.
 */
export class AuthUserPoolGroupsRollbackRefactorer extends RollbackCategoryRefactorer {
  protected resourceTypes(): string[] {
    return [USER_POOL_GROUP_TYPE];
  }

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'auth');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, `auth${this.resource.resourceName}`);
  }

  protected targetLogicalId(sourceId: string, sourceResource: CFNResource): string | undefined {
    switch (sourceResource.Type) {
      case 'AWS::Cognito::UserPoolGroup':
        return `${sourceResource.Properties['GroupName']}Group`;
      default:
        return undefined;
    }
  }
}
