import { AuthForwardRefactorer } from '../../../../commands/gen2-migration/refactor/auth/auth-forward';
import { CFNResource } from '../../../../commands/gen2-migration/cfn-template';
import { AwsClients } from '../../../../commands/gen2-migration/aws-clients';
import { StackFacade } from '../../../../commands/gen2-migration/refactor/stack-facade';
import { MoveMapping } from '../../../../commands/gen2-migration/refactor/workflow/category-refactorer';

/** Helper: convert MoveMapping[] to Map<sourceId, targetId> for easy assertions */
function toIdMap(mappings: MoveMapping[]): Map<string, string> {
  return new Map(mappings.map((m) => [m.sourceId, m.targetId]));
}

describe('AuthForwardRefactorer.buildResourceMappings - UserPoolClient disambiguation', () => {
  function createRefactorer() {
    const clients = new AwsClients({ region: 'us-east-1' });
    const gen1Env = new StackFacade(clients, 'gen1');
    const gen2Branch = new StackFacade(clients, 'gen2');
    return new (class extends AuthForwardRefactorer {
      constructor() {
        super(gen1Env, gen2Branch, clients, 'us-east-1', '123456789', 'appId', 'main');
      }
      public testBuildResourceMappings(source: Map<string, CFNResource>, target: Map<string, CFNResource>): MoveMapping[] {
        return this.buildResourceMappings(source, target);
      }
    })();
  }

  it('maps main auth resources with correct Web/Native disambiguation', () => {
    const refactorer = createRefactorer();

    const targetResources = new Map<string, CFNResource>([
      ['amplifyAuthUserPool1234ABCD', { Type: 'AWS::Cognito::UserPool', Properties: {} }],
      ['amplifyAuthUserPoolAppClient1234ABCD', { Type: 'AWS::Cognito::UserPoolClient', Properties: {} }],
      ['amplifyAuthUserPoolNativeAppClient1234ABCD', { Type: 'AWS::Cognito::UserPoolClient', Properties: {} }],
      ['amplifyAuthIdentityPool1234ABCD', { Type: 'AWS::Cognito::IdentityPool', Properties: {} }],
      ['amplifyAuthIdentityPoolRoleMap1234ABCD', { Type: 'AWS::Cognito::IdentityPoolRoleAttachment', Properties: {} }],
    ]);

    const mainAuthSource = new Map<string, CFNResource>([
      ['UserPool', { Type: 'AWS::Cognito::UserPool', Properties: {} }],
      ['UserPoolClientWeb', { Type: 'AWS::Cognito::UserPoolClient', Properties: {} }],
      ['UserPoolClient', { Type: 'AWS::Cognito::UserPoolClient', Properties: {} }],
      ['IdentityPool', { Type: 'AWS::Cognito::IdentityPool', Properties: {} }],
      ['IdentityPoolRoleMap', { Type: 'AWS::Cognito::IdentityPoolRoleAttachment', Properties: {} }],
    ]);

    const mappings = refactorer.testBuildResourceMappings(mainAuthSource, targetResources);
    const map = toIdMap(mappings);

    // All source resources are mapped
    expect(map.size).toBe(5);

    // UserPoolClient Web/Native disambiguation is correct
    expect(map.get('UserPoolClientWeb')).toBe('amplifyAuthUserPoolAppClient1234ABCD');
    expect(map.get('UserPoolClient')).toBe('amplifyAuthUserPoolNativeAppClient1234ABCD');

    // Other mappings
    expect(map.get('UserPool')).toBe('amplifyAuthUserPool1234ABCD');
  });
});
