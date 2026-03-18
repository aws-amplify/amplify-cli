import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';

/**
 * Forward refactorer for DynamoDB storage resources.
 * Moves DynamoDB tables from Gen1 to Gen2.
 */
export class StorageDynamoForwardRefactorer extends ForwardCategoryRefactorer {
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'storage');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'storage');
  }

  protected resourceTypes(): string[] {
    return ['AWS::DynamoDB::Table'];
  }
}
