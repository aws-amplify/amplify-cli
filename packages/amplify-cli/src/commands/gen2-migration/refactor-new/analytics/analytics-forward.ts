import { CFNResource } from '../cfn-template';
import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';

export const ANALYTICS_RESOURCE_TYPES = ['AWS::Kinesis::Stream'];

/**
 * Forward refactorer for the analytics category (Kinesis).
 * Moves analytics resources from Gen1 to Gen2.
 */
export class AnalyticsForwardRefactorer extends ForwardCategoryRefactorer {
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'analytics');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'analytics');
  }

  protected resourceTypes(): string[] {
    return ANALYTICS_RESOURCE_TYPES;
  }

  /**
   * Matches source and target resources by type.
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
