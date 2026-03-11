import { Output, Parameter } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource } from '../cfn-template';
import { RefactorOperation } from '../refactorer';
import { AwsClients } from '../aws-clients';
import { StackFacade } from '../stack-facade';
import { retrieveOAuthValues } from '../oauth-values-retriever';
import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';
import { discoverGen1AuthStacks } from './auth-utils';

const AUTH_RESOURCE_TYPES = [
  'AWS::Cognito::UserPool',
  'AWS::Cognito::UserPoolClient',
  'AWS::Cognito::IdentityPool',
  'AWS::Cognito::IdentityPoolRoleAttachment',
  'AWS::Cognito::UserPoolDomain',
  'AWS::Cognito::UserPoolGroup',
];

const GEN1_WEB_APP_CLIENT = 'UserPoolClientWeb';
const GEN2_NATIVE_APP_CLIENT = 'UserPoolNativeAppClient';
const HOSTED_PROVIDER_META_PARAMETER_NAME = 'hostedUIProviderMeta';
const HOSTED_PROVIDER_CREDENTIALS_PARAMETER_NAME = 'hostedUIProviderCreds';
const USER_POOL_ID_OUTPUT_KEY_NAME = 'UserPoolId';

/**
 * Types with multiple instances that need disambiguation in forward mapping.
 */
const TYPES_WITH_MULTIPLE_RESOURCES = ['AWS::Cognito::UserPoolClient', 'AWS::Cognito::UserPoolGroup', 'AWS::IAM::Role'];

/**
 * Forward refactorer for the auth category.
 *
 * Handles the two-source-stack case: Gen1 may have separate stacks for
 * main auth and UserPoolGroups. Gen2 combines them into one stack.
 * Overrides plan() to handle multiple source stacks mapping to one destination.
 */
export class AuthForwardRefactorer extends ForwardCategoryRefactorer {
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
   * Overrides plan() to handle two Gen1 source stacks → one Gen2 destination.
   */
  public override async plan(): Promise<RefactorOperation[]> {
    const { mainAuthStackId, userPoolGroupStackId } = await discoverGen1AuthStacks(this.gen1Env);
    const gen2StackId = await this.findNestedStack(this.gen2Branch, 'auth');

    if (!mainAuthStackId && !gen2StackId) return [];
    if (!mainAuthStackId || !gen2StackId) {
      throw new AmplifyError('InvalidStackError', {
        message: `Auth category exists in ${mainAuthStackId ? 'source' : 'destination'} but not ${
          mainAuthStackId ? 'destination' : 'source'
        } stack`,
      });
    }

    const mainAuthSource = await this.resolveSource(mainAuthStackId);
    const userPoolGroupSource = userPoolGroupStackId ? await this.resolveSource(userPoolGroupStackId) : undefined;
    const target = await this.resolveTarget(gen2StackId);

    if (mainAuthSource.resourcesToMove.size === 0) {
      return []; // Nothing to move — skip auth category
    }

    const mainAuthIdMap = this.buildResourceMappings(mainAuthSource.resourcesToMove, target.resourcesToMove);
    const userPoolGroupIdMap = userPoolGroupSource
      ? this.buildResourceMappings(userPoolGroupSource.resourcesToMove, target.resourcesToMove)
      : new Map<string, string>();

    const { operations: beforeMoveOps, postTargetTemplate } = this.beforeMovePlan(mainAuthSource, target);

    // Chain: second move uses output of first
    const { finalSource: finalMainAuth, finalTarget: gen2AfterMainAuth } = this.buildRefactorTemplates(
      mainAuthSource,
      postTargetTemplate,
      mainAuthIdMap,
    );
    const mainAuthMoveOps = this.buildMoveOperations(mainAuthStackId, gen2StackId, finalMainAuth, gen2AfterMainAuth, mainAuthIdMap);

    const userPoolGroupOps: RefactorOperation[] = [];
    if (userPoolGroupSource && userPoolGroupSource.resourcesToMove.size > 0) {
      const { finalSource: finalUserPoolGroup, finalTarget: gen2AfterBoth } = this.buildRefactorTemplates(
        userPoolGroupSource,
        gen2AfterMainAuth,
        userPoolGroupIdMap,
      );
      userPoolGroupOps.push(
        ...this.buildMoveOperations(userPoolGroupStackId!, gen2StackId, finalUserPoolGroup, gen2AfterBoth, userPoolGroupIdMap),
      );
    }

    const ops: RefactorOperation[] = [];
    ops.push(...this.updateSource(mainAuthSource));
    if (userPoolGroupSource) {
      ops.push(...this.updateSource(userPoolGroupSource));
    }
    ops.push(...this.updateTarget(target));
    ops.push(...beforeMoveOps);
    ops.push(...mainAuthMoveOps);
    ops.push(...userPoolGroupOps);
    return ops;
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
      cognitoIdpClient: this.clients.cognito,
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
  protected buildResourceMappings(
    sourceResources: Map<string, CFNResource>,
    targetResources: Map<string, CFNResource>,
  ): Map<string, string> {
    const mapping = new Map<string, string>();
    const usedTargetIds = new Set<string>();

    for (const [sourceId, sourceResource] of sourceResources) {
      for (const [targetId, targetResource] of targetResources) {
        if (sourceResource.Type !== targetResource.Type || usedTargetIds.has(targetId)) continue;

        if (TYPES_WITH_MULTIPLE_RESOURCES.includes(sourceResource.Type)) {
          if (sourceResource.Type === 'AWS::Cognito::UserPoolClient') {
            const isWebPair = sourceId === GEN1_WEB_APP_CLIENT && !targetId.includes(GEN2_NATIVE_APP_CLIENT);
            const isNativePair = sourceId !== GEN1_WEB_APP_CLIENT && targetId.includes(GEN2_NATIVE_APP_CLIENT);
            if (!isWebPair && !isNativePair) continue;
          } else if (!targetId.includes(sourceId)) {
            continue;
          }
        }

        mapping.set(sourceId, targetId);
        usedTargetIds.add(targetId);
        break;
      }
    }
    return mapping;
  }

  // Required by abstract base but not used (plan() is overridden)
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'auth');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'auth');
  }
}
