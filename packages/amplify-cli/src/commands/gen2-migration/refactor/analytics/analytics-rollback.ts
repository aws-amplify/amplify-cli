import { CFNResource } from '../../cfn-template';
import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { ANALYTICS_RESOURCE_TYPES } from './analytics-forward';

/**
 * Rollback refactorer for the analytics category (Kinesis).
 * Moves analytics resources from Gen2 back to Gen1.
 * Uses the default gen1LogicalIds-based buildResourceMappings from RollbackCategoryRefactorer.
 */
export class AnalyticsKinesisRollbackRefactorer extends RollbackCategoryRefactorer {
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'analytics');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'analytics');
  }

  protected resourceTypes(): string[] {
    return ANALYTICS_RESOURCE_TYPES;
  }

  protected targetLogicalId(sourceId: string, sourceResource: CFNResource): string | undefined {
    switch (sourceResource.Type) {
      case 'AWS::Kinesis::Stream':
        return 'KinesisStream';
      default:
        return undefined;
    }
  }
}
