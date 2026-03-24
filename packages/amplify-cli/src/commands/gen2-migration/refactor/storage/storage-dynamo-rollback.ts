import { CFNResource } from '../../cfn-template';
import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';

/**
 * Rollback refactorer for DynamoDB storage resources.
 * Moves DynamoDB tables from Gen2 back to Gen1.
 * Each table gets its own nested stack using 'storage' + resourceName as prefix.
 */
export class StorageDynamoRollbackRefactorer extends RollbackCategoryRefactorer {
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'storage' + this.resource.resourceName);
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'storage' + this.resource.resourceName);
  }

  protected resourceTypes(): string[] {
    return ['AWS::DynamoDB::Table'];
  }

  protected targetLogicalId(_sourceId: string, sourceResource: CFNResource): string | undefined {
    switch (sourceResource.Type) {
      case 'AWS::DynamoDB::Table':
        return 'DynamoDBTable';
      default:
        return undefined;
    }
  }
}
