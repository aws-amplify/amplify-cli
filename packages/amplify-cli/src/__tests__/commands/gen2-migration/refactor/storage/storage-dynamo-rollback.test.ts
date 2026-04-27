import { StorageDynamoRollbackRefactorer } from '../../../../../commands/gen2-migration/refactor/storage/storage-dynamo-rollback';
import { Gen1App } from '../../../../../commands/gen2-migration/_common/gen1-app';
import { Cfn } from '../../../../../commands/gen2-migration/_common/cfn';
import { noOpLogger } from '../../_framework/logger';

describe('StorageDynamoRollbackRefactorer.targetLogicalId', () => {
  const refactorer = new (class extends StorageDynamoRollbackRefactorer {
    public testTargetLogicalId(type: string): string | undefined {
      return this.targetLogicalId('anySourceId', { Type: type, Properties: {} });
    }
  })(
    null as any,
    null as any,
    { region: 'us-east-1' } as unknown as Gen1App,
    '123',
    noOpLogger(),
    { category: 'storage', resourceName: 'test', service: 'DynamoDB', key: 'storage:DynamoDB' as const },
    null as unknown as Cfn,
  );

  it('maps DynamoDB::Table to DynamoDBTable', () => {
    expect(refactorer.testTargetLogicalId('AWS::DynamoDB::Table')).toBe('DynamoDBTable');
  });

  it('returns undefined for unknown resource type', () => {
    expect(refactorer.testTargetLogicalId('AWS::Lambda::Function')).toBeUndefined();
  });
});
