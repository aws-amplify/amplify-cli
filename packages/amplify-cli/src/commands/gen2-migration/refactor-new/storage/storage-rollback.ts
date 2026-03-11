import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource } from '../cfn-template';
import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';

const STORAGE_RESOURCE_TYPES = ['AWS::S3::Bucket', 'AWS::DynamoDB::Table'];

/**
 * Known Gen1 logical resource IDs for storage resource types.
 * Used during rollback to map Gen2 logical IDs back to Gen1 logical IDs.
 */
const GEN1_LOGICAL_IDS = new Map<string, string>([
  ['AWS::S3::Bucket', 'S3Bucket'],
  ['AWS::DynamoDB::Table', 'DynamoDBTable'],
]);

/**
 * Rollback refactorer for the storage category (S3 + DynamoDB).
 * Moves storage resources from Gen2 back to Gen1.
 */
export class StorageRollbackRefactorer extends RollbackCategoryRefactorer {
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'storage');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'storage');
  }

  protected resourceTypes(): string[] {
    return STORAGE_RESOURCE_TYPES;
  }

  /**
   * Maps Gen2 source resources to known Gen1 logical IDs by resource type.
   */
  protected buildResourceMappings(
    sourceResources: Map<string, CFNResource>,
    _targetResources: Map<string, CFNResource>,
  ): Map<string, string> {
    const mapping = new Map<string, string>();
    for (const [sourceId, resource] of sourceResources) {
      const gen1LogicalId = GEN1_LOGICAL_IDS.get(resource.Type);
      if (!gen1LogicalId) {
        throw new AmplifyError('InvalidStackError', {
          message: `No known Gen1 logical ID for storage resource type '${resource.Type}' (source: '${sourceId}')`,
        });
      }
      mapping.set(sourceId, gen1LogicalId);
    }
    return mapping;
  }
}
