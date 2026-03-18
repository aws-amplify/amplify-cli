import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';

/**
 * Rollback refactorer for DynamoDB storage resources.
 * Moves DynamoDB tables from Gen2 back to Gen1.
 */
export class StorageDynamoRollbackRefactorer extends RollbackCategoryRefactorer {
  protected override readonly gen1LogicalIds = new Map<string, string>([['AWS::DynamoDB::Table', 'DynamoDBTable']]);

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'storage');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'storage');
  }

  protected resourceTypes(): string[] {
    return ['AWS::DynamoDB::Table'];
  }
}
