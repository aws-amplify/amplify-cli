import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { DYNAMO_TABLE_TYPE } from './storage-dynamo-forward';

export class StorageDynamoRollbackRefactorer extends RollbackCategoryRefactorer {
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'storage');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, `storage${this.resource.resourceName}`);
  }

  protected resourceTypes(): string[] {
    return [DYNAMO_TABLE_TYPE];
  }
}
