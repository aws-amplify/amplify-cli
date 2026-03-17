import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';
import { StackFacade } from '../stack-facade';
import { AwsClients } from '../../aws-clients';

/**
 * Forward refactorer for DynamoDB storage resources.
 * Moves DynamoDB tables from Gen1 to Gen2.
 * Each table gets its own nested stack using 'storage' + resourceName as prefix.
 */
export class StorageDynamoForwardRefactorer extends ForwardCategoryRefactorer {
  private readonly resourceName: string;

  constructor(gen1Env: StackFacade, gen2Branch: StackFacade, clients: AwsClients, region: string, accountId: string, resourceName: string) {
    super(gen1Env, gen2Branch, clients, region, accountId);
    this.resourceName = resourceName;
  }

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'storage' + this.resourceName);
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'storage' + this.resourceName);
  }

  protected resourceTypes(): string[] {
    return ['AWS::DynamoDB::Table'];
  }
}
