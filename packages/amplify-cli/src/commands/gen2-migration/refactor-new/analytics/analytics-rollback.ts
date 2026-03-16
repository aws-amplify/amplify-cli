import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { ANALYTICS_RESOURCE_TYPES } from './analytics-forward';

/**
 * Rollback refactorer for the analytics category (Kinesis).
 * Moves analytics resources from Gen2 back to Gen1.
 * Uses the default gen1LogicalIds-based buildResourceMappings from RollbackCategoryRefactorer.
 */
export class AnalyticsKinesisRollbackRefactorer extends RollbackCategoryRefactorer {
  protected override readonly gen1LogicalIds = new Map<string, string>([['AWS::Kinesis::Stream', 'KinesisStream']]);

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'analytics');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'analytics');
  }

  protected resourceTypes(): string[] {
    return ANALYTICS_RESOURCE_TYPES;
  }
}
