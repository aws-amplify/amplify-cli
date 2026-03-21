import { Output, Parameter } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { AwsClients } from '../../aws-clients';
import { StackFacade } from '../stack-facade';
import { retrieveOAuthValues } from '../oauth-values-retriever';
import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';
import { SpinningLogger } from '../../_spinning-logger';
import { DiscoveredResource } from '../../generate/_infra/gen1-app';
import { CFNResource } from '../../cfn-template';

const HOSTED_PROVIDER_META_PARAMETER_NAME = 'hostedUIProviderMeta';
const HOSTED_PROVIDER_CREDENTIALS_PARAMETER_NAME = 'hostedUIProviderCreds';
const USER_POOL_ID_OUTPUT_KEY_NAME = 'UserPoolId';

export const GEN1_NATIVE_APP_CLIENT = 'UserPoolClient';
export const GEN1_WEB_CLIENT = 'UserPoolClientWeb';

export const GEN2_NATIVE_APP_CLIENT = 'UserPoolNativeAppClient';
export const GEN2_WEB_CLIENT = 'UserPoolAppClient';

export const USER_POOL_CLIENT_TYPE = 'AWS::Cognito::UserPoolClient';

export const RESOURCE_TYPES = [
  'AWS::Cognito::UserPool',
  USER_POOL_CLIENT_TYPE,
  'AWS::Cognito::IdentityPool',
  'AWS::Cognito::IdentityPoolRoleAttachment',
  'AWS::Cognito::UserPoolDomain',
];

/**
 * Forward refactorer for the auth:Cognito resource.
 *
 * Moves main auth resources from Gen1 to Gen2.
 */
export class AuthCognitoForwardRefactorer extends ForwardCategoryRefactorer {
  constructor(
    gen1Env: StackFacade,
    gen2Branch: StackFacade,
    clients: AwsClients,
    region: string,
    accountId: string,
    logger: SpinningLogger,
    private readonly appId: string,
    private readonly environmentName: string,
    protected readonly resource: DiscoveredResource,
  ) {
    super(gen1Env, gen2Branch, clients, region, accountId, logger, resource);
  }

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
      ssmClient: this.clients.ssm,
      cognitoIdpClient: this.clients.cognitoIdentityProvider,
      oAuthParameter: oAuthParam,
      userPoolId,
      appId: this.appId,
      environmentName: this.environmentName,
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

  protected override match(sourceId: string, sourceResource: CFNResource, targetId: string, targetResource: CFNResource): boolean {
    if (sourceResource.Type !== targetResource.Type) {
      return false;
    }
    switch (sourceResource.Type) {
      case USER_POOL_CLIENT_TYPE: {
        switch (sourceId) {
          case GEN1_WEB_CLIENT:
            return targetId.includes(GEN2_WEB_CLIENT);
          case GEN1_NATIVE_APP_CLIENT:
            return targetId.includes(GEN2_NATIVE_APP_CLIENT);
          default:
            throw new AmplifyError('MigrationError', {
              message: `Unexpected source logical id ${sourceId} for resource of type ${USER_POOL_CLIENT_TYPE}`,
            });
        }
      }
      default:
        return true;
    }
  }

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, `auth${this.resource.resourceName}`);
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    // in gen2 all auth resources are in a single auth nested stack
    return this.findNestedStack(this.gen2Branch, 'auth');
  }
}
