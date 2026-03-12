import { AuthForwardRefactorer } from '../../../../commands/gen2-migration/refactor/auth/auth-forward';
import { CFNResource } from '../../../../commands/gen2-migration/cfn-template';
import { AwsClients } from '../../../../commands/gen2-migration/refactor/aws-clients';
import { StackFacade } from '../../../../commands/gen2-migration/refactor/stack-facade';

/**
 * Auth forward mapping is called twice during plan(): once for main auth resources,
 * once for UserPoolGroup resources. Both calls receive the same target resource map
 * (the full Gen2 auth stack). The mapping relies on type disjointness to prevent
 * a Gen2 target resource from being mapped twice.
 *
 * This test verifies that no target resource ID appears in both mapping outputs,
 * even when the target map contains resources of all auth types.
 */
describe('AuthForwardRefactorer.buildResourceMappings - no target overlap', () => {
  // Create a minimal instance just to access the protected method
  function createRefactorer() {
    const clients = new AwsClients({ region: 'us-east-1' });
    const gen1Env = new StackFacade(clients, 'gen1');
    const gen2Branch = new StackFacade(clients, 'gen2');
    return new (class extends AuthForwardRefactorer {
      constructor() {
        super(gen1Env, gen2Branch, clients, 'us-east-1', '123456789', 'appId', 'main');
      }
      // Expose protected method for testing
      public testBuildResourceMappings(source: Map<string, CFNResource>, target: Map<string, CFNResource>) {
        return this.buildResourceMappings(source, target);
      }
    })();
  }

  it('maps main auth and UserPoolGroup resources to disjoint target IDs', () => {
    const refactorer = createRefactorer();

    // Gen2 target: contains ALL auth resource types
    const targetResources = new Map<string, CFNResource>([
      ['amplifyAuthUserPool1234ABCD', { Type: 'AWS::Cognito::UserPool', Properties: {} }],
      ['amplifyAuthUserPoolAppClient1234ABCD', { Type: 'AWS::Cognito::UserPoolClient', Properties: {} }],
      ['amplifyAuthUserPoolNativeAppClient1234ABCD', { Type: 'AWS::Cognito::UserPoolClient', Properties: {} }],
      ['amplifyAuthIdentityPool1234ABCD', { Type: 'AWS::Cognito::IdentityPool', Properties: {} }],
      ['amplifyAuthIdentityPoolRoleMap1234ABCD', { Type: 'AWS::Cognito::IdentityPoolRoleAttachment', Properties: {} }],
      ['amplifyAuthAdminGroup1234ABCD', { Type: 'AWS::Cognito::UserPoolGroup', Properties: {} }],
      ['amplifyAuthEditorGroup1234ABCD', { Type: 'AWS::Cognito::UserPoolGroup', Properties: {} }],
    ]);

    // Call 1: Main auth resources (Gen1 source)
    const mainAuthSource = new Map<string, CFNResource>([
      ['UserPool', { Type: 'AWS::Cognito::UserPool', Properties: {} }],
      ['UserPoolClientWeb', { Type: 'AWS::Cognito::UserPoolClient', Properties: {} }],
      ['UserPoolClient', { Type: 'AWS::Cognito::UserPoolClient', Properties: {} }],
      ['IdentityPool', { Type: 'AWS::Cognito::IdentityPool', Properties: {} }],
      ['IdentityPoolRoleMap', { Type: 'AWS::Cognito::IdentityPoolRoleAttachment', Properties: {} }],
    ]);

    const mainAuthMapping = refactorer.testBuildResourceMappings(mainAuthSource, targetResources);

    // Call 2: UserPoolGroup resources (Gen1 source)
    const userPoolGroupSource = new Map<string, CFNResource>([
      ['AdminGroup', { Type: 'AWS::Cognito::UserPoolGroup', Properties: {} }],
      ['EditorGroup', { Type: 'AWS::Cognito::UserPoolGroup', Properties: {} }],
    ]);

    const userPoolGroupMapping = refactorer.testBuildResourceMappings(userPoolGroupSource, targetResources);

    // Verify: no target ID appears in both mappings
    const mainAuthTargetIds = new Set(mainAuthMapping.values());
    const userPoolGroupTargetIds = new Set(userPoolGroupMapping.values());

    for (const targetId of userPoolGroupTargetIds) {
      expect(mainAuthTargetIds.has(targetId)).toBe(false);
    }

    // Verify: all source resources are mapped
    expect(mainAuthMapping.size).toBe(5);
    expect(userPoolGroupMapping.size).toBe(2);

    // Verify: UserPoolClient Web/Native disambiguation is correct
    expect(mainAuthMapping.get('UserPoolClientWeb')).toBe('amplifyAuthUserPoolAppClient1234ABCD');
    expect(mainAuthMapping.get('UserPoolClient')).toBe('amplifyAuthUserPoolNativeAppClient1234ABCD');

    // Verify: UserPoolGroup matching by name inclusion
    expect(mainAuthMapping.get('UserPool')).toBe('amplifyAuthUserPool1234ABCD');
    expect(userPoolGroupMapping.get('AdminGroup')).toBe('amplifyAuthAdminGroup1234ABCD');
    expect(userPoolGroupMapping.get('EditorGroup')).toBe('amplifyAuthEditorGroup1234ABCD');
  });
});
