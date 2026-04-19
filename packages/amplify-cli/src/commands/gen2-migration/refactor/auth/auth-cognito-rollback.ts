import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { RESOURCE_TYPES } from './auth-cognito-forward';

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
}
