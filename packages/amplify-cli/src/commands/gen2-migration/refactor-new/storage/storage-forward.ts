import { CFNResource } from '../cfn-template';
import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';

export const STORAGE_RESOURCE_TYPES = ['AWS::S3::Bucket', 'AWS::DynamoDB::Table'];

/**
 * Forward refactorer for the storage category (S3 + DynamoDB).
 * Moves storage resources from Gen1 to Gen2.
 */
export class StorageForwardRefactorer extends ForwardCategoryRefactorer {
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'storage');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'storage');
  }

  protected resourceTypes(): string[] {
    return STORAGE_RESOURCE_TYPES;
  }

  /**
   * Matches source and target resources by type.
   * Storage has at most one S3 bucket and one DynamoDB table — no disambiguation needed.
   */
  protected buildResourceMappings(
    sourceResources: Map<string, CFNResource>,
    targetResources: Map<string, CFNResource>,
  ): Map<string, string> {
    const mapping = new Map<string, string>();
    const usedTargetIds = new Set<string>();
    for (const [sourceId, sourceResource] of sourceResources) {
      for (const [targetId, targetResource] of targetResources) {
        if (sourceResource.Type === targetResource.Type && !usedTargetIds.has(targetId)) {
          mapping.set(sourceId, targetId);
          usedTargetIds.add(targetId);
          break;
        }
      }
    }
    return mapping;
  }
}
