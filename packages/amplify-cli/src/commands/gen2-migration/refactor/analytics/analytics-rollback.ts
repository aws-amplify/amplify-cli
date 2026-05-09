import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { ANALYTICS_RESOURCE_TYPES } from './analytics-forward';

/**
 * Rollback refactorer for the analytics category (Kinesis).
 * Moves analytics resources from Gen2 back to Gen1.
 */
export class AnalyticsKinesisRollbackRefactorer extends RollbackCategoryRefactorer {
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'analytics');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, `analytics${this.resource.resourceName}`);
  }

  protected resourceTypes(): string[] {
    return ANALYTICS_RESOURCE_TYPES;
  }
}
