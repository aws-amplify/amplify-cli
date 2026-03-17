import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';

export const ANALYTICS_RESOURCE_TYPES = ['AWS::Kinesis::Stream'];

/**
 * Forward refactorer for the analytics category (Kinesis).
 * Moves analytics resources from Gen1 to Gen2.
 * Uses the default type-matching buildResourceMappings from ForwardCategoryRefactorer.
 */
export class AnalyticsKinesisForwardRefactorer extends ForwardCategoryRefactorer {
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'analytics');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'analytics');
  }

  protected resourceTypes(): string[] {
    return ANALYTICS_RESOURCE_TYPES;
  }
}
