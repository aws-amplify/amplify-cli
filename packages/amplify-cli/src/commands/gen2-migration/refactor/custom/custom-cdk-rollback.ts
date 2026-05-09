import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { CUSTOM_RESOURCE_TYPES } from './custom-cdk-forward';

/**
 * Rollback refactorer for custom CDK resources.
 * Moves custom CDK resources from Gen2 back to Gen1.
 */
export class CustomCDKRollbackRefactorer extends RollbackCategoryRefactorer {
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, `custom${this.resource.resourceName}`);
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, `custom${this.resource.resourceName}`);
  }

  protected resourceTypes(): string[] {
    return CUSTOM_RESOURCE_TYPES;
  }
}
