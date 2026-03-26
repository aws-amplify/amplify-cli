import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';

export const DYNAMO_TABLE_TYPE = 'AWS::DynamoDB::Table';

/**
 * Forward refactorer for DynamoDB storage resources.
 * Moves DynamoDB tables from Gen1 to Gen2.
 * Each table gets its own nested stack using 'storage' + resourceName as prefix.
 */
export class StorageDynamoForwardRefactorer extends ForwardCategoryRefactorer {
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'storage' + this.resource.resourceName);
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'storage' + this.resource.resourceName);
  }

  protected resourceTypes(): string[] {
    return [DYNAMO_TABLE_TYPE];
  }
}
