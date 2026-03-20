import { Output, Parameter } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { AwsClients } from '../../aws-clients';
import { StackFacade } from '../stack-facade';
import { retrieveOAuthValues } from '../oauth-values-retriever';
import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';
import { SpinningLogger } from '../../_spinning-logger';
import { DiscoveredResource } from '../../generate/_infra/gen1-app';
import { CFNResource } from '../../cfn-template';

const GEN1_WEB_APP_CLIENT = 'UserPoolClientWeb';
const HOSTED_PROVIDER_META_PARAMETER_NAME = 'hostedUIProviderMeta';
const HOSTED_PROVIDER_CREDENTIALS_PARAMETER_NAME = 'hostedUIProviderCreds';
const USER_POOL_ID_OUTPUT_KEY_NAME = 'UserPoolId';

export const GEN2_NATIVE_APP_CLIENT = 'UserPoolNativeAppClient';

export const AUTH_RESOURCE_TYPES = [
  'AWS::Cognito::UserPool',
  'AWS::Cognito::UserPoolClient',
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
    return AUTH_RESOURCE_TYPES;
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
      case 'AWS::Cognito::UserPoolClient': {
        const isWebPair = sourceId === GEN1_WEB_APP_CLIENT && !targetId.includes(GEN2_NATIVE_APP_CLIENT);
        const isNativePair = sourceId !== GEN1_WEB_APP_CLIENT && targetId.includes(GEN2_NATIVE_APP_CLIENT);
        return isWebPair || isNativePair;
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
