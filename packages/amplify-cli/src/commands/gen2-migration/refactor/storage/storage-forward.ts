import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';
import { StackFacade } from '../stack-facade';

export const S3_BUCKET_TYPE = 'AWS::S3::Bucket';

/**
 * Forward refactorer for S3 storage resources.
 * Moves S3 buckets from Gen1 to Gen2.
 */
export class StorageS3ForwardRefactorer extends ForwardCategoryRefactorer {
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'storage' + this.resource.resourceName);
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return findS3NestedStack(this.gen2Branch);
  }

  protected resourceTypes(): string[] {
    return [S3_BUCKET_TYPE];
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
    const hasS3 = Object.values(template.Resources).some((r) => r.Type === S3_BUCKET_TYPE);
    if (hasS3) return stackId;
  }
  return undefined;
}
