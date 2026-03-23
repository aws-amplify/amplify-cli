import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { StackFacade } from '../stack-facade';
import { AwsClients } from '../../aws-clients';
import { findS3NestedStack } from './storage-forward';

/**
 * Rollback refactorer for S3 storage resources.
 * Moves S3 buckets from Gen2 back to Gen1.
 */
export class StorageS3RollbackRefactorer extends RollbackCategoryRefactorer {
  protected override readonly gen1LogicalIds = new Map<string, string>([['AWS::S3::Bucket', 'S3Bucket']]);

  private readonly resourceName: string;

  constructor(gen1Env: StackFacade, gen2Branch: StackFacade, clients: AwsClients, region: string, accountId: string, resourceName: string) {
    super(gen1Env, gen2Branch, clients, region, accountId);
    this.resourceName = resourceName;
  }

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return findS3NestedStack(this.gen2Branch);
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'storage' + this.resourceName);
  }

  protected resourceTypes(): string[] {
    return ['AWS::S3::Bucket'];
  }
}
