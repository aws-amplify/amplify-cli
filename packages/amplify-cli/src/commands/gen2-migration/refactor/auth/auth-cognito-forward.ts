import { Output, Parameter, ResourceToImport } from '@aws-sdk/client-cloudformation';
import {
  DescribeUserPoolCommand,
  DescribeIdentityProviderCommand,
  ListIdentityProvidersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { retrieveOAuthValues } from '../oauth-values-retriever';
import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';
import { RefactorBlueprint } from '../workflow/category-refactorer';
import { CFNResource } from '../../_infra/cfn-template';
import { AmplifyMigrationOperation } from '../../_infra/operation';
import { extractStackNameFromId } from '../utils';
import CLITable from 'cli-table3';

const HOSTED_PROVIDER_META_PARAMETER_NAME = 'hostedUIProviderMeta';
const HOSTED_PROVIDER_CREDENTIALS_PARAMETER_NAME = 'hostedUIProviderCreds';
const USER_POOL_ID_OUTPUT_KEY_NAME = 'UserPoolId';

export const GEN1_NATIVE_APP_CLIENT = 'UserPoolClient';
export const GEN1_WEB_CLIENT = 'UserPoolClientWeb';

export const GEN2_NATIVE_APP_CLIENT = 'UserPoolNativeAppClient';
export const GEN2_WEB_CLIENT = 'UserPoolAppClient';

export const USER_POOL_CLIENT_TYPE = 'AWS::Cognito::UserPoolClient';
export const USER_POOL_TYPE = 'AWS::Cognito::UserPool';
export const IDENTITY_POOL_TYPE = 'AWS::Cognito::IdentityPool';
export const IDENTITY_POOL_ROLE_ATTACHMENT_TYPE = 'AWS::Cognito::IdentityPoolRoleAttachment';
export const USER_POOL_DOMAIN_TYPE = 'AWS::Cognito::UserPoolDomain';
export const USER_POOL_IDENTITY_PROVIDER_TYPE = 'AWS::Cognito::UserPoolIdentityProvider';

export const RESOURCE_TYPES = [
  USER_POOL_TYPE,
  USER_POOL_CLIENT_TYPE,
  IDENTITY_POOL_TYPE,
  IDENTITY_POOL_ROLE_ATTACHMENT_TYPE,
  USER_POOL_DOMAIN_TYPE,
  USER_POOL_IDENTITY_PROVIDER_TYPE,
];

interface IdpConfig {
  readonly providerName: string;
  readonly providerType: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly authorizeScopes: string;
  readonly attributeMapping: Record<string, string>;
}

interface SocialAuthConfig {
  readonly userPoolId: string;
  readonly domain: string;
  readonly providers: IdpConfig[];
}

/**
 * Forward refactorer for the auth:Cognito resource.
 *
 * Moves main auth resources from Gen1 to Gen2.
 * For social auth apps, imports Gen1's LambdaCallout-created IDPs and domain
 * into the Gen2 stack as native CFN resources during the move phase.
 */
export class AuthCognitoForwardRefactorer extends ForwardCategoryRefactorer {
  /**
   * Returns the full set including domain and IDP types. These types don't exist in the
   * Gen1 CFN template (they're created by a Lambda trigger), so they won't appear in the
   * refactor mappings. They are imported into Gen2 as a separate step in move().
   */
  protected resourceTypes(): string[] {
    return RESOURCE_TYPES;
  }

  /**
   * OAuth hook: retrieves credentials and updates the hostedUIProviderCreds parameter.
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

  /**
   * Executes the standard resource refactor, then imports Gen1's
   * physical domain and IDPs into the Gen2 stack as native CFN resources.
   */
  protected override async move(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    const baseOps = await super.move(blueprint);

    const importOp = await this.buildImportSocialAuthOperation(blueprint);
    if (importOp) {
      return [...baseOps, importOp];
    }

    return baseOps;
  }

  /**
   * Builds an operation that imports Gen1's physical domain and IDPs into the
   * Gen2 stack. Returns undefined if the app doesn't use social auth.
   */
  private async buildImportSocialAuthOperation(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation | undefined> {
    const socialAuthConfig = await this.fetchSocialAuthConfig(blueprint.sourceStackId);
    if (!socialAuthConfig) {
      return undefined;
    }

    const gen2StackId = blueprint.targetStackId;
    const gen2Template = await this.cfn.fetchTemplate(gen2StackId);
    const gen2IdpLogicalIds = new Map<string, string>();
    let gen2DomainLogicalId: string | undefined;

    // Find the Gen2 logical IDs we'll import the physical Gen1 resources into
    // We require providerName + logicalId to disambiguate between multiple providers
    for (const [logicalId, resource] of Object.entries(gen2Template.Resources)) {
      if (resource.Type === USER_POOL_DOMAIN_TYPE) {
        gen2DomainLogicalId = logicalId;
      } else if (resource.Type === USER_POOL_IDENTITY_PROVIDER_TYPE) {
        const providerName = resource.Properties.ProviderName as string;
        if (providerName) {
          gen2IdpLogicalIds.set(providerName, logicalId);
        }
      }
    }

    if (!gen2DomainLogicalId) {
      this.debug('No Gen2 UserPoolDomain resource found — skipping import');
      return undefined;
    }

    if (gen2IdpLogicalIds.size === 0) {
      this.debug('No Gen2 UserPoolIdentityProvider resources found — skipping import');
      return undefined;
    }

    return {
      resource: this.resource,
      validate: () => undefined,
      describe: async () => {
        const gen2StackName = extractStackNameFromId(gen2StackId);
        const table = new CLITable({
          head: ['Source Physical ID', 'Target Logical ID'],
          style: { head: [] },
        });
        table.push([socialAuthConfig.domain, gen2DomainLogicalId!]);
        for (const provider of socialAuthConfig.providers) {
          const logicalId = gen2IdpLogicalIds.get(provider.providerName);
          if (logicalId) {
            const label =
              provider.providerType !== provider.providerName
                ? `${provider.providerName} (${provider.providerType})`
                : provider.providerName;
            table.push([label, logicalId]);
          }
        }
        return [`Import social auth resources into '${gen2StackName}'\n\n${table.toString()}`];
      },
      execute: async () => {
        const templateForImport = await this.cfn.fetchTemplate(gen2StackId);

        const { resourcesToImport, templateAdditions } = this.buildImportSpec(socialAuthConfig, gen2DomainLogicalId!, gen2IdpLogicalIds);

        for (const [logicalId, resource] of Object.entries(templateAdditions)) {
          templateForImport.Resources[logicalId] = resource;
        }

        await this.cfn.importResources({
          stackName: gen2StackId,
          templateBody: templateForImport,
          resourcesToImport,
          resource: this.resource,
        });
      },
    };
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

  /**
   * Fetches domain and IDP config directly from Cognito. These resources are
   * Lambda-created (not in the Gen1 CFN template) so the live API is the only source.
   */
  private async fetchSocialAuthConfig(sourceStackId: string): Promise<SocialAuthConfig | undefined> {
    const sourceStack = await this.gen1Env.fetchStack(sourceStackId);
    const userPoolId = (sourceStack.Outputs ?? []).find((o) => o.OutputKey === USER_POOL_ID_OUTPUT_KEY_NAME)?.OutputValue;
    if (!userPoolId) {
      return undefined;
    }

    const cognitoClient = this.gen1App.clients.cognitoIdentityProvider;

    const poolResponse = await cognitoClient.send(new DescribeUserPoolCommand({ UserPoolId: userPoolId }));
    const domain = poolResponse?.UserPool?.Domain;
    if (!domain) {
      this.debug('Gen1 UserPool has no domain — skipping social auth import');
      return undefined;
    }

    const listResponse = await cognitoClient.send(new ListIdentityProvidersCommand({ UserPoolId: userPoolId }));
    const providerSummaries = listResponse?.Providers ?? [];
    if (providerSummaries.length === 0) {
      this.debug('Gen1 UserPool has no identity providers — skipping social auth import');
      return undefined;
    }

    const providers: IdpConfig[] = [];
    for (const summary of providerSummaries) {
      const providerName = summary.ProviderName;
      if (!providerName) continue;

      const describeResponse = await cognitoClient.send(
        new DescribeIdentityProviderCommand({ UserPoolId: userPoolId, ProviderName: providerName }),
      );
      const idp = describeResponse.IdentityProvider;
      if (!idp?.ProviderDetails) continue;

      providers.push({
        providerName,
        providerType: idp.ProviderType ?? providerName,
        clientId: idp.ProviderDetails.client_id ?? '',
        clientSecret: idp.ProviderDetails.client_secret ?? '',
        authorizeScopes: idp.ProviderDetails.authorize_scopes ?? '',
        attributeMapping: (idp.AttributeMapping as Record<string, string>) ?? {},
      });
    }

    this.debug(`Fetched social auth config: domain=${domain}, providers=${providers.map((p) => p.providerName).join(',')}`);
    return { userPoolId, domain, providers };
  }

  /**
   * Builds the CFN import spec: template additions with DeletionPolicy: Retain
   * (so rollback can orphan them without deleting the physical resources) and
   * resource identifiers for the import change set.
   */
  private buildImportSpec(
    config: SocialAuthConfig,
    domainLogicalId: string,
    idpLogicalIds: Map<string, string>,
  ): { resourcesToImport: ResourceToImport[]; templateAdditions: Record<string, CFNResource> } {
    const resourcesToImport: ResourceToImport[] = [];
    const templateAdditions: Record<string, CFNResource> = {};

    templateAdditions[domainLogicalId] = {
      Type: USER_POOL_DOMAIN_TYPE,
      DeletionPolicy: 'Retain',
      Properties: {
        Domain: config.domain,
        UserPoolId: config.userPoolId,
      },
    };
    resourcesToImport.push({
      ResourceType: USER_POOL_DOMAIN_TYPE,
      LogicalResourceId: domainLogicalId,
      ResourceIdentifier: {
        UserPoolId: config.userPoolId,
        Domain: config.domain,
      },
    });

    for (const provider of config.providers) {
      const logicalId = idpLogicalIds.get(provider.providerName);
      if (!logicalId) {
        this.debug(`No Gen2 logical ID for provider ${provider.providerName} — skipping import`);
        continue;
      }

      templateAdditions[logicalId] = {
        Type: USER_POOL_IDENTITY_PROVIDER_TYPE,
        DeletionPolicy: 'Retain',
        Properties: {
          UserPoolId: config.userPoolId,
          ProviderName: provider.providerName,
          ProviderType: provider.providerType,
          ProviderDetails: {
            client_id: provider.clientId,
            client_secret: provider.clientSecret,
            authorize_scopes: provider.authorizeScopes,
          },
          AttributeMapping: provider.attributeMapping,
        },
      };

      resourcesToImport.push({
        ResourceType: USER_POOL_IDENTITY_PROVIDER_TYPE,
        LogicalResourceId: logicalId,
        ResourceIdentifier: {
          UserPoolId: config.userPoolId,
          ProviderName: provider.providerName,
        },
      });
    }

    return { resourcesToImport, templateAdditions };
  }
}
