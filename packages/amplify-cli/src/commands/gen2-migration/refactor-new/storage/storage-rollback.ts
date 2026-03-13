import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { STORAGE_RESOURCE_TYPES } from './storage-forward';

/**
 * Rollback refactorer for the storage category (S3 + DynamoDB).
 * Moves storage resources from Gen2 back to Gen1.
 * Uses the default gen1LogicalIds-based buildResourceMappings from RollbackCategoryRefactorer.
 */
export class StorageRollbackRefactorer extends RollbackCategoryRefactorer {
  protected override readonly gen1LogicalIds = new Map<string, string>([
    ['AWS::S3::Bucket', 'S3Bucket'],
    ['AWS::DynamoDB::Table', 'DynamoDBTable'],
  ]);

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'storage');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'storage');
  }

  protected resourceTypes(): string[] {
    return STORAGE_RESOURCE_TYPES;
  }
}
