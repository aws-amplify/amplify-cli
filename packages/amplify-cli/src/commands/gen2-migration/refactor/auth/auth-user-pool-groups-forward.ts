import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource } from '../../_common/cfn-template';
import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';

export const USER_POOL_GROUP_TYPE = 'AWS::Cognito::UserPoolGroup';

export const RESOURCE_TYPES = [USER_POOL_GROUP_TYPE];

/**
 * Forward refactorer for the auth:UserPoolGroups resource.
 *
 * Moves user pool groups auth resources from Gen1 to Gen2.
 */
export class AuthUserPoolGroupsForwardRefactorer extends ForwardCategoryRefactorer {
  protected resourceTypes(): string[] {
    return RESOURCE_TYPES;
  }

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, `auth${this.resource.resourceName}`);
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    // in gen2 all auth resources are in a single auth nested stack
    return this.findNestedStack(this.gen2Branch, 'auth');
  }

  protected async gen2LogicalId(sourceId: string, sourceResource: CFNResource, targetResources: Map<string, CFNResource>): Promise<string> {
    if (sourceResource.Type !== USER_POOL_GROUP_TYPE) {
      return await super.gen2LogicalId(sourceId, sourceResource, targetResources);
    }
    const candidates = Array.from(targetResources.keys()).filter(
      (r) =>
        targetResources.get(r)?.Type === sourceResource.Type &&
        sourceResource.Properties['GroupName'] === targetResources.get(r)?.Properties['GroupName'],
    );
    if (candidates.length !== 1) {
      throw new AmplifyError('MigrationError', {
        message: `Unable to map Gen1 resource ${sourceId} (${sourceResource.Type}) to Gen2 resource`,
      });
    }
    return candidates[0];
  }
}
