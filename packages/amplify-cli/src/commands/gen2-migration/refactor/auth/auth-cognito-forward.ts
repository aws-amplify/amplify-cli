import { Output, Parameter } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { retrieveOAuthValues } from '../oauth-values-retriever';
import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';
import { CFNResource } from '../../_infra/cfn-template';

const HOSTED_PROVIDER_META_PARAMETER_NAME = 'hostedUIProviderMeta';
const HOSTED_PROVIDER_CREDENTIALS_PARAMETER_NAME = 'hostedUIProviderCreds';
const USER_POOL_ID_OUTPUT_KEY_NAME = 'UserPoolId';

export const GEN1_NATIVE_APP_CLIENT_LOGICAL_ID = 'UserPoolClient';
export const GEN1_WEB_CLIENT_LOGICAL_ID = 'UserPoolClientWeb';

export const GEN2_NATIVE_APP_CLIENT = 'UserPoolNativeAppClient';
export const GEN2_WEB_CLIENT = 'UserPoolAppClient';

export const USER_POOL_CLIENT_TYPE = 'AWS::Cognito::UserPoolClient';
export const USER_POOL_TYPE = 'AWS::Cognito::UserPool';
export const IDENTITY_POOL_TYPE = 'AWS::Cognito::IdentityPool';
export const IDENTITY_POOL_ROLE_ATTACHMENT_TYPE = 'AWS::Cognito::IdentityPoolRoleAttachment';
export const USER_POOL_DOMAIN_TYPE = 'AWS::Cognito::UserPoolDomain';

export const RESOURCE_TYPES = [
  USER_POOL_TYPE,
  USER_POOL_CLIENT_TYPE,
  IDENTITY_POOL_TYPE,
  IDENTITY_POOL_ROLE_ATTACHMENT_TYPE,
  USER_POOL_DOMAIN_TYPE,
];

/**
 * Forward refactorer for the auth:Cognito resource.
 *
 * Moves main auth resources from Gen1 to Gen2.
 */
export class AuthCognitoForwardRefactorer extends ForwardCategoryRefactorer {
  protected resourceTypes(): string[] {
    return RESOURCE_TYPES;
  }

  /**
   * OAuth hook: retrieves credentials and updates hostedUIProviderCreds parameter.
   */
  protected override async resolveOAuthParameters(parameters: Parameter[], outputs: Output[]): Promise<Parameter[]> {
    const oAuthParam = parameters.find((p) => p.ParameterKey === HOSTED_PROVIDER_META_PARAMETER_NAME);
    if (!oAuthParam) return parameters;

    const userPoolId = outputs.find((o) => o.OutputKey === USER_POOL_ID_OUTPUT_KEY_NAME)?.OutputValue;
    if (!userPoolId) {
      throw new AmplifyError('MissingExpectedParameterError', {
        message: `Auth stack output '${USER_POOL_ID_OUTPUT_KEY_NAME}' not found — required for OAuth credential retrieval`,
      });
    }

    const oAuthValues = await retrieveOAuthValues({
      ssmClient: this.gen1App.clients.ssm,
      cognitoIdpClient: this.gen1App.clients.cognitoIdentityProvider,
      oAuthParameter: oAuthParam,
      userPoolId,
      appId: this.gen1App.appId,
      environmentName: this.gen1App.envName,
    });

    const credsParam = parameters.find((p) => p.ParameterKey === HOSTED_PROVIDER_CREDENTIALS_PARAMETER_NAME);
    if (!credsParam) {
      throw new AmplifyError('MissingExpectedParameterError', {
        message: `Auth stack parameter '${HOSTED_PROVIDER_CREDENTIALS_PARAMETER_NAME}' not found`,
      });
    }
    credsParam.ParameterValue = JSON.stringify(oAuthValues);
    return parameters;
  }

  protected async gen2LogicalId(sourceId: string, sourceResource: CFNResource, targetResources: Map<string, CFNResource>): Promise<string> {
    if (sourceResource.Type !== USER_POOL_CLIENT_TYPE) {
      return await super.gen2LogicalId(sourceId, sourceResource, targetResources);
    }
    let candidates: string[];
    const targetResourceIds = targetResources.keys();

    switch (sourceId) {
      case GEN1_WEB_CLIENT_LOGICAL_ID: {
        candidates = Array.from(targetResourceIds.filter((r) => r.includes(GEN2_WEB_CLIENT)));
        break;
      }
      case GEN1_NATIVE_APP_CLIENT_LOGICAL_ID: {
        candidates = Array.from(targetResourceIds.filter((r) => r.includes(GEN2_NATIVE_APP_CLIENT)));
        break;
      }
      default:
        throw new AmplifyError('MigrationError', {
          message: `Unexpected source logical id ${sourceId} for resource of type ${USER_POOL_CLIENT_TYPE}`,
        });
    }

    if (candidates.length !== 1) {
      throw new AmplifyError('MigrationError', {
        message: `Unable to map Gen1 resource ${sourceId} (${sourceResource.Type}) to Gen2 resource`,
      });
    }
    return candidates[0];
  }

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, `auth${this.resource.resourceName}`);
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    // in gen2 all auth resources are in a single auth nested stack
    return this.findNestedStack(this.gen2Branch, 'auth');
  }
}
