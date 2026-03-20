import { CFNResource } from '../../cfn-template';
import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { AUTH_RESOURCE_TYPES, GEN2_NATIVE_APP_CLIENT } from './auth-cognito-forward';

/**
 * Rollback refactorer for the auth:Cognito resource.
 *
 * Moves main auth resources from Gen2 back to Gen1.
 */
export class AuthCognitoRollbackRefactorer extends RollbackCategoryRefactorer {
  protected resourceTypes(): string[] {
    return AUTH_RESOURCE_TYPES;
  }

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'auth');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, `auth${this.resource.resourceName}`);
  }

  protected targetLogicalId(sourceId: string, sourceResource: CFNResource): string | undefined {
    switch (sourceResource.Type) {
      case 'AWS::Cognito::UserPoolClient':
        return sourceId.includes(GEN2_NATIVE_APP_CLIENT) ? 'UserPoolClient' : 'UserPoolClientWeb';
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
