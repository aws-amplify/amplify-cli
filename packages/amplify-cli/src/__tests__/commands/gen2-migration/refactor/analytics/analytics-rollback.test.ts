import { AnalyticsKinesisRollbackRefactorer } from '../../../../../commands/gen2-migration/refactor/analytics/analytics-rollback';
import { Gen1App } from '../../../../../commands/gen2-migration/generate/_infra/gen1-app';
import { Cfn } from '../../../../../commands/gen2-migration/refactor/cfn';
import { noOpLogger } from '../../_framework/logger';

describe('AnalyticsKinesisRollbackRefactorer.targetLogicalId', () => {
  const refactorer = new (class extends AnalyticsKinesisRollbackRefactorer {
    public testTargetLogicalId(type: string): string | undefined {
      return this.targetLogicalId('anySourceId', { Type: type, Properties: {} });
    }
  })(
    null as any,
    null as any,
    { region: 'us-east-1' } as unknown as Gen1App,
    '123',
    noOpLogger(),
    { category: 'analytics', resourceName: 'test', service: 'Kinesis', key: 'analytics:Kinesis' as const },
    null as unknown as Cfn,
  );

  it('maps Kinesis::Stream to KinesisStream', () => {
    expect(refactorer.testTargetLogicalId('AWS::Kinesis::Stream')).toBe('KinesisStream');
  });

  it('returns undefined for unknown resource type', () => {
    expect(refactorer.testTargetLogicalId('AWS::Lambda::Function')).toBeUndefined();
  });
});
