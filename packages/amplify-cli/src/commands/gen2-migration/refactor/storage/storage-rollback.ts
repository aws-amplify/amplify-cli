import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { StackFacade } from '../stack-facade';
import { AwsClients } from '../../aws-clients';

/**
 * Rollback refactorer for S3 storage resources.
 * Moves S3 buckets from Gen2 back to Gen1.
 *
 * Gen1 names S3 stacks as 'storage' + resourceName (e.g. 'storageavatars').
 * Gen2 names the built-in storage stack as 'storage' + CDK hash (e.g. 'storage0EC3F24A'),
 * while per-DDB-table stacks use 'storage' + lowercase resourceName + CDK hash.
 */
export class StorageS3RollbackRefactorer extends RollbackCategoryRefactorer {
  protected override readonly gen1LogicalIds = new Map<string, string>([['AWS::S3::Bucket', 'S3Bucket']]);

  private readonly resourceName: string;

  constructor(gen1Env: StackFacade, gen2Branch: StackFacade, clients: AwsClients, region: string, accountId: string, resourceName: string) {
    super(gen1Env, gen2Branch, clients, region, accountId);
    this.resourceName = resourceName;
  }

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findS3NestedStack(this.gen2Branch);
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'storage' + this.resourceName);
  }

  protected resourceTypes(): string[] {
    return ['AWS::S3::Bucket'];
  }

  /**
   * Finds the Gen2 S3 nested stack by distinguishing it from per-DDB-table stacks.
   * The built-in Amplify storage construct produces 'storage' + CDK hash ([0-9A-F]),
   * while DDB stacks use 'storage' + resourceName (lowercase first char) + CDK hash.
   */
  private async findS3NestedStack(facade: StackFacade): Promise<string | undefined> {
    const stacks = await facade.fetchNestedStacks();
    return stacks.find((s) => {
      const id = s.LogicalResourceId ?? '';
      if (!id.startsWith('storage')) return false;
      const afterStorage = id.charAt('storage'.length);
      return afterStorage !== '' && !/^[a-z]/.test(afterStorage);
    })?.PhysicalResourceId;
  }
}
