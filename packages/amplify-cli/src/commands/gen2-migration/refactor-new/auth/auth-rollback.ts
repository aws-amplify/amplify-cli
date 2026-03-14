import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource } from '../../cfn-template';
import { MoveMapping } from '../workflow/category-refactorer';
import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { AUTH_RESOURCE_TYPES, GEN2_NATIVE_APP_CLIENT, discoverGen1AuthStacks } from './auth-utils';

/**
 * Known Gen1 logical resource IDs for main auth resource types.
 */
const GEN1_AUTH_LOGICAL_IDS = new Map<string, string>([
  ['AWS::Cognito::UserPool', 'UserPool'],
  ['AWS::Cognito::UserPoolClient', 'UserPoolClientWeb'],
  ['AWS::Cognito::IdentityPool', 'IdentityPool'],
  ['AWS::Cognito::IdentityPoolRoleAttachment', 'IdentityPoolRoleMap'],
  ['AWS::Cognito::UserPoolDomain', 'UserPoolDomain'],
]);

/**
 * Rollback refactorer for the auth category.
 *
 * Moves main auth resources from Gen2 back to Gen1.
 * UserPoolGroup support will be added back in a future change.
 */
export class AuthCognitoRollbackRefactorer extends RollbackCategoryRefactorer {
  protected resourceTypes(): string[] {
    return AUTH_RESOURCE_TYPES;
  }

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'auth');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    const { mainAuthStackId } = await discoverGen1AuthStacks(this.gen1Env);
    return mainAuthStackId;
  }

  /**
   * Auth rollback mapping: NativeAppClient → 'UserPoolClient', others → known Gen1 logical ID.
   */
  protected buildResourceMappings(sourceResources: Map<string, CFNResource>, _targetResources: Map<string, CFNResource>): MoveMapping[] {
    const mappings: MoveMapping[] = [];
    for (const [sourceId, resource] of sourceResources) {
      if (sourceId.includes(GEN2_NATIVE_APP_CLIENT)) {
        mappings.push({ sourceId, targetId: 'UserPoolClient', resource });
      } else {
        const gen1Id = GEN1_AUTH_LOGICAL_IDS.get(resource.Type);
        if (!gen1Id) {
          throw new AmplifyError('InvalidStackError', {
            message: `No known Gen1 logical ID for auth resource type '${resource.Type}' (source: '${sourceId}')`,
          });
        }
        mappings.push({ sourceId, targetId: gen1Id, resource });
      }
    }
    return mappings;
  }
}
