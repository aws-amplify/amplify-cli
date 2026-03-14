import { Output, Parameter } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource } from '../../cfn-template';
import { AwsClients } from '../../aws-clients';
import { StackFacade } from '../stack-facade';
import { retrieveOAuthValues } from '../oauth-values-retriever';
import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';
import { MoveMapping } from '../workflow/category-refactorer';
import { AUTH_RESOURCE_TYPES, GEN2_NATIVE_APP_CLIENT, discoverGen1AuthStacks } from './auth-utils';

const GEN1_WEB_APP_CLIENT = 'UserPoolClientWeb';
const HOSTED_PROVIDER_META_PARAMETER_NAME = 'hostedUIProviderMeta';
const HOSTED_PROVIDER_CREDENTIALS_PARAMETER_NAME = 'hostedUIProviderCreds';
const USER_POOL_ID_OUTPUT_KEY_NAME = 'UserPoolId';

/**
 * Forward refactorer for the auth category.
 *
 * Moves main auth resources from Gen1 to Gen2.
 * UserPoolGroup support will be added back in a future change.
 */
export class AuthCognitoForwardRefactorer extends ForwardCategoryRefactorer {
  constructor(
    gen1Env: StackFacade,
    gen2Branch: StackFacade,
    clients: AwsClients,
    region: string,
    accountId: string,
    private readonly appId: string,
    private readonly environmentName: string,
  ) {
    super(gen1Env, gen2Branch, clients, region, accountId);
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

  /**
   * Auth forward mapping with UserPoolClient Web/Native disambiguation.
   */
  protected buildResourceMappings(sourceResources: Map<string, CFNResource>, targetResources: Map<string, CFNResource>): MoveMapping[] {
    const mappings: MoveMapping[] = [];
    const usedTargetIds = new Set<string>();

    for (const [sourceId, sourceResource] of sourceResources) {
      let matched = false;
      for (const [targetId, targetResource] of targetResources) {
        if (sourceResource.Type !== targetResource.Type || usedTargetIds.has(targetId)) continue;

        if (sourceResource.Type === 'AWS::Cognito::UserPoolClient') {
          const isWebPair = sourceId === GEN1_WEB_APP_CLIENT && !targetId.includes(GEN2_NATIVE_APP_CLIENT);
          const isNativePair = sourceId !== GEN1_WEB_APP_CLIENT && targetId.includes(GEN2_NATIVE_APP_CLIENT);
          if (!isWebPair && !isNativePair) continue;
        }

        mappings.push({ sourceId, targetId, resource: sourceResource });
        usedTargetIds.add(targetId);
        matched = true;
        break;
      }
      if (!matched) {
        throw new AmplifyError('InvalidStackError', {
          message: `Source resource '${sourceId}' (type '${sourceResource.Type}') has no corresponding target resource`,
        });
      }
    }
    return mappings;
  }

  protected async fetchSourceStackId(): Promise<string | undefined> {
    const { mainAuthStackId } = await discoverGen1AuthStacks(this.gen1Env);
    return mainAuthStackId;
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'auth');
  }
}
