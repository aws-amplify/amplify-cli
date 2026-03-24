import { StorageS3RollbackRefactorer } from '../../../../../commands/gen2-migration/refactor/storage/storage-rollback';
import { Cfn } from '../../../../../commands/gen2-migration/refactor/cfn';
import { noOpLogger } from '../../_framework/logger';

describe('StorageS3RollbackRefactorer.targetLogicalId', () => {
  const refactorer = new (class extends StorageS3RollbackRefactorer {
    public testTargetLogicalId(type: string): string | undefined {
      return this.targetLogicalId('anySourceId', { Type: type, Properties: {} });
    }
  })(
    null as any,
    null as any,
    null as any,
    'us-east-1',
    '123',
    noOpLogger(),
    { category: 'storage', resourceName: 'test', service: 'S3', key: 'storage:S3' as const },
    null as unknown as Cfn,
  );

  it('maps S3::Bucket to S3Bucket', () => {
    expect(refactorer.testTargetLogicalId('AWS::S3::Bucket')).toBe('S3Bucket');
  });

  it('returns undefined for unknown resource type', () => {
    expect(refactorer.testTargetLogicalId('AWS::Lambda::Function')).toBeUndefined();
  });
});
