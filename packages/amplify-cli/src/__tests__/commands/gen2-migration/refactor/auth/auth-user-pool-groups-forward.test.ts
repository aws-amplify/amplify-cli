import { AuthUserPoolGroupsForwardRefactorer } from '../../../../../commands/gen2-migration/refactor/auth/auth-user-pool-groups-forward';
import { CFNResource } from '../../../../../commands/gen2-migration/_common/cfn-template';
import { Gen1App } from '../../../../../commands/gen2-migration/_common/gen1-app';
import { Cfn } from '../../../../../commands/gen2-migration/_common/cfn';
import { ResourceMapping } from '@aws-sdk/client-cloudformation';
import { noOpLogger } from '../../_framework/logger';

const r = (type: string, props: Record<string, string | number | object> = {}): CFNResource => ({ Type: type, Properties: props });

describe('AuthUserPoolGroupsForwardRefactorer.buildResourceMappings — GroupName matching', () => {
  function createRefactorer() {
    return new (class extends AuthUserPoolGroupsForwardRefactorer {
      public async testBuildResourceMappings(
        source: Map<string, CFNResource>,
        target: Map<string, CFNResource>,
      ): Promise<ResourceMapping[]> {
        return this.buildResourceMappings(source, target, 'gen1-auth', 'gen2-auth');
      }
    })(
      null as any,
      null as any,
      { region: 'us-east-1' } as unknown as Gen1App,
      '123',
      noOpLogger(),
      {
        category: 'auth',
        resourceName: 'userPoolGroups',
        service: 'Cognito-UserPool-Groups',
        key: 'auth:Cognito-UserPool-Groups' as const,
      },
      null as unknown as Cfn,
    );
  }

  it('matches groups by GroupName property', async () => {
    const refactorer = createRefactorer();
    const mappings = await refactorer.testBuildResourceMappings(
      new Map([['AdminGroup', r('AWS::Cognito::UserPoolGroup', { GroupName: 'Admin' })]]),
      new Map([['amplifyAuthAdminGroup1234', r('AWS::Cognito::UserPoolGroup', { GroupName: 'Admin' })]]),
    );
    expect(mappings).toHaveLength(1);
    expect(mappings[0].Source!.LogicalResourceId).toBe('AdminGroup');
    expect(mappings[0].Destination!.LogicalResourceId).toBe('amplifyAuthAdminGroup1234');
  });

  it('does not match groups with different GroupName', async () => {
    const refactorer = createRefactorer();
    await expect(
      refactorer.testBuildResourceMappings(
        new Map([['AdminGroup', r('AWS::Cognito::UserPoolGroup', { GroupName: 'Admin' })]]),
        new Map([['amplifyAuthEditorGroup1234', r('AWS::Cognito::UserPoolGroup', { GroupName: 'Editor' })]]),
      ),
    ).rejects.toThrow('Unable to map Gen1 resource');
  });

  it('matches multiple groups independently', async () => {
    const refactorer = createRefactorer();
    const mappings = await refactorer.testBuildResourceMappings(
      new Map([
        ['AdminGroup', r('AWS::Cognito::UserPoolGroup', { GroupName: 'Admin' })],
        ['EditorGroup', r('AWS::Cognito::UserPoolGroup', { GroupName: 'Editor' })],
      ]),
      new Map([
        ['amplifyAuthAdminGroup1234', r('AWS::Cognito::UserPoolGroup', { GroupName: 'Admin' })],
        ['amplifyAuthEditorGroup1234', r('AWS::Cognito::UserPoolGroup', { GroupName: 'Editor' })],
      ]),
    );
    expect(mappings).toHaveLength(2);
  });
});
