import { CFNResource } from '../../_infra/cfn-template';
import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { RESOURCE_TYPES, USER_POOL_GROUP_TYPE } from './auth-user-pool-groups-forward';

/**
 * Rollback refactorer for the auth:UserPoolGroups resource.
 *
 * Moves user pool groups auth resources from Gen2 back to Gen1.
 */
export class AuthUserPoolGroupsRollbackRefactorer extends RollbackCategoryRefactorer {
  protected resourceTypes(): string[] {
    return RESOURCE_TYPES;
  }

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'auth');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, `auth${this.resource.resourceName}`);
  }

  protected gen1LogicalId(sourceId: string, sourceResource: CFNResource): string | undefined {
    switch (sourceResource.Type) {
      case USER_POOL_GROUP_TYPE:
        return `${sourceResource.Properties['GroupName']}Group`;
      default:
        return undefined;
    }
  }
}
