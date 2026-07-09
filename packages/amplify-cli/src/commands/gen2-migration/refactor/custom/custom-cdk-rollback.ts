import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';

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
    // custom resources may contain all possible types of stateful resources.
    return this.gen1App.statefulResourceTypes;
  }
}
