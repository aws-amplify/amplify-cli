import { AuthUserPoolGroupsRollbackRefactorer } from '../../../../../commands/gen2-migration/refactor/auth/auth-user-pool-groups-rollback';
import { Gen1App } from '../../../../../commands/gen2-migration/generate/_infra/gen1-app';
import { Cfn } from '../../../../../commands/gen2-migration/refactor/cfn';
import { noOpLogger } from '../../_framework/logger';

describe('AuthUserPoolGroupsRollbackRefactorer.targetLogicalId', () => {
  const refactorer = new (class extends AuthUserPoolGroupsRollbackRefactorer {
    public testTargetLogicalId(sourceId: string, type: string, props: Record<string, string | number | object>): string | undefined {
      return this.targetLogicalId(sourceId, { Type: type, Properties: props });
    }
  })(
    null as any,
    null as any,
    { region: 'us-east-1' } as unknown as Gen1App,
    '123',
    noOpLogger(),
    { category: 'auth', resourceName: 'userPoolGroups', service: 'Cognito-UserPool-Groups', key: 'auth:Cognito-UserPool-Groups' as const },
    null as unknown as Cfn,
  );

  it('maps UserPoolGroup to {GroupName}Group', () => {
    expect(refactorer.testTargetLogicalId('amplifyAuthAdminGroup1234', 'AWS::Cognito::UserPoolGroup', { GroupName: 'Admin' })).toBe(
      'AdminGroup',
    );
  });

  it('returns undefined for unknown resource type', () => {
    expect(refactorer.testTargetLogicalId('SomeResource', 'AWS::Lambda::Function', {})).toBeUndefined();
  });
});
