import { CFNResource } from '../../cfn-template';
import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';

export const USER_POOL_GROUP_TYPE = 'AWS::Cognito::UserPoolGroup';

/**
 * Forward refactorer for the auth:UserPoolGroups resource.
 *
 * Moves user pool groups auth resources from Gen1 to Gen2.
 */
export class AuthUserPoolGroupsForwardRefactorer extends ForwardCategoryRefactorer {
  protected resourceTypes(): string[] {
    return [USER_POOL_GROUP_TYPE];
  }

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, `auth${this.resource.resourceName}`);
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    // in gen2 all auth resources are in a single auth nested stack
    return this.findNestedStack(this.gen2Branch, 'auth');
  }

  protected override match(_sourceId: string, sourceResource: CFNResource, _targetId: string, targetResource: CFNResource): boolean {
    if (sourceResource.Type !== targetResource.Type) {
      return false;
    }
    switch (sourceResource.Type) {
      case USER_POOL_GROUP_TYPE: {
        const sourceGroupName = sourceResource.Properties['GroupName'];
        const targetGroupName = targetResource.Properties['GroupName'];
        return sourceGroupName === targetGroupName;
      }
      default:
        return false;
    }
  }
}
