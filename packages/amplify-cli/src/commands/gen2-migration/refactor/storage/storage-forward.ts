import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';

export const STORAGE_RESOURCE_TYPES = ['AWS::S3::Bucket', 'AWS::DynamoDB::Table'];

/**
 * Forward refactorer for S3 storage resources.
 * Moves S3 buckets from Gen1 to Gen2.
 */
export class StorageS3ForwardRefactorer extends ForwardCategoryRefactorer {
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'storage');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'storage');
  }

  protected resourceTypes(): string[] {
    return ['AWS::S3::Bucket'];
  }
}
