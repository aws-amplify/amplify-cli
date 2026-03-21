import { CFNResource } from '../../cfn-template';
import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import {
  RESOURCE_TYPES,
  GEN1_NATIVE_APP_CLIENT,
  GEN1_WEB_CLIENT,
  GEN2_NATIVE_APP_CLIENT,
  GEN2_WEB_CLIENT,
  USER_POOL_CLIENT_TYPE,
} from './auth-cognito-forward';

/**
 * Rollback refactorer for the auth:Cognito resource.
 *
 * Moves main auth resources from Gen2 back to Gen1.
 */
export class AuthCognitoRollbackRefactorer extends RollbackCategoryRefactorer {
  protected resourceTypes(): string[] {
    return RESOURCE_TYPES;
  }

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'auth');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, `auth${this.resource.resourceName}`);
  }

  protected targetLogicalId(sourceId: string, sourceResource: CFNResource): string | undefined {
    switch (sourceResource.Type) {
      case USER_POOL_CLIENT_TYPE: {
        if (sourceId.includes(GEN2_NATIVE_APP_CLIENT)) {
          return GEN1_NATIVE_APP_CLIENT;
        }
        if (sourceId.includes(GEN2_WEB_CLIENT)) {
          return GEN1_WEB_CLIENT;
        }
        throw new Error();
      }
      case 'AWS::Cognito::UserPool':
        return 'UserPool';
      case 'AWS::Cognito::IdentityPool':
        return 'IdentityPool';
      case 'AWS::Cognito::IdentityPoolRoleAttachment':
        return 'IdentityPoolRoleMap';
      case 'AWS::Cognito::UserPoolDomain':
        return 'UserPoolDomain';
      default:
        return undefined;
    }
  }
}
