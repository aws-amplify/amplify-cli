import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';
import { StackFacade } from '../stack-facade';
import { AwsClients } from '../../aws-clients';
import { SpinningLogger } from '../../_spinning-logger';

/**
 * Forward refactorer for S3 storage resources.
 * Moves S3 buckets from Gen1 to Gen2.
 */
export class StorageS3ForwardRefactorer extends ForwardCategoryRefactorer {
  private readonly resourceName: string;

  constructor(
    gen1Env: StackFacade,
    gen2Branch: StackFacade,
    clients: AwsClients,
    region: string,
    accountId: string,
    logger: SpinningLogger,
    resourceName: string,
  ) {
    super(gen1Env, gen2Branch, clients, region, accountId, logger);
    this.resourceName = resourceName;
  }

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'storage' + this.resourceName);
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return findS3NestedStack(this.gen2Branch);
  }

  protected resourceTypes(): string[] {
    return ['AWS::S3::Bucket'];
  }
}

/**
 * Finds the Gen2 S3 nested stack by fetching the template of each 'storage'-prefixed
 * nested stack and checking whether it contains an AWS::S3::Bucket resource.
 */
export async function findS3NestedStack(facade: StackFacade): Promise<string | undefined> {
  const stacks = await facade.fetchNestedStacks();
  for (const s of stacks) {
    const id = s.LogicalResourceId ?? '';
    if (!id.startsWith('storage')) continue;
    const stackId = s.PhysicalResourceId;
    if (!stackId) continue;
    const template = await facade.fetchTemplate(stackId);
    const hasS3 = Object.values(template.Resources).some((r) => r.Type === 'AWS::S3::Bucket');
    if (hasS3) return stackId;
  }
  return undefined;
}
