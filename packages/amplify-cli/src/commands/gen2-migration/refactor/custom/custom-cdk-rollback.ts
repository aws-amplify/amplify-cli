import { CFNResource } from '../../_infra/cfn-template';
import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { CUSTOM_RESOURCE_TYPES } from './custom-cdk-forward';

/**
 * Rollback refactorer for the analytics category (Kinesis).
 * Moves analytics resources from Gen2 back to Gen1.
 * Uses the default gen1LogicalIds-based buildResourceMappings from RollbackCategoryRefactorer.
 */
export class CustomCDKRollbackRefactorer extends RollbackCategoryRefactorer {
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'analytics');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'analytics');
  }

  protected resourceTypes(): string[] {
    return CUSTOM_RESOURCE_TYPES;
  }

  protected gen1LogicalId(sourceId: string, sourceResource: CFNResource): string | undefined {
    return undefined;
  }
}
