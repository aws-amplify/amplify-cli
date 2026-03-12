import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';

export const STORAGE_RESOURCE_TYPES = ['AWS::S3::Bucket', 'AWS::DynamoDB::Table'];

/**
 * Forward refactorer for the storage category (S3 + DynamoDB).
 * Moves storage resources from Gen1 to Gen2.
 * Uses the default type-matching buildResourceMappings from ForwardCategoryRefactorer.
 */
export class StorageForwardRefactorer extends ForwardCategoryRefactorer {
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'storage');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'storage');
  }

  protected resourceTypes(): string[] {
    return STORAGE_RESOURCE_TYPES;
  }
}
