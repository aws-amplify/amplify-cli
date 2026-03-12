import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource } from '../cfn-template';
import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { ANALYTICS_RESOURCE_TYPES } from './analytics-forward';

/**
 * Known Gen1 logical resource IDs for analytics resource types.
 */
const GEN1_LOGICAL_IDS = new Map<string, string>([['AWS::Kinesis::Stream', 'KinesisStream']]);

/**
 * Rollback refactorer for the analytics category (Kinesis).
 * Moves analytics resources from Gen2 back to Gen1.
 */
export class AnalyticsRollbackRefactorer extends RollbackCategoryRefactorer {
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'analytics');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'analytics');
  }

  protected resourceTypes(): string[] {
    return ANALYTICS_RESOURCE_TYPES;
  }

  /**
   * Maps Gen2 source resources to known Gen1 logical IDs by resource type.
   */
  protected buildResourceMappings(
    sourceResources: Map<string, CFNResource>,
    _targetResources: Map<string, CFNResource>,
  ): Map<string, string> {
    const mapping = new Map<string, string>();
    for (const [sourceId, resource] of sourceResources) {
      const gen1LogicalId = GEN1_LOGICAL_IDS.get(resource.Type);
      if (!gen1LogicalId) {
        throw new AmplifyError('InvalidStackError', {
          message: `No known Gen1 logical ID for analytics resource type '${resource.Type}' (source: '${sourceId}')`,
        });
      }
      mapping.set(sourceId, gen1LogicalId);
    }
    return mapping;
  }
}
