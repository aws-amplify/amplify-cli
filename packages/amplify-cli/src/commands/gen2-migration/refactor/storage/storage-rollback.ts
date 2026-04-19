import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { findS3NestedStack, S3_BUCKET_TYPE } from './storage-forward';

/**
 * Rollback refactorer for S3 storage resources.
 * Moves S3 buckets from Gen2 back to Gen1.
 */
export class StorageS3RollbackRefactorer extends RollbackCategoryRefactorer {
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return findS3NestedStack(this.gen2Branch);
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'storage' + this.resource.resourceName);
  }

  protected resourceTypes(): string[] {
    return [S3_BUCKET_TYPE];
  }
}
