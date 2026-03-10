import { mockClient } from 'aws-sdk-client-mock';
import * as idp from '@aws-sdk/client-cognito-identity-provider';
import { MigrationApp } from '../app';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';

/**
 * Maps Gen1 trigger names (from `cli-inputs.json` `cognitoConfig.triggers`) to
 * the corresponding Cognito `LambdaConfig` property names.
 *
 * Gen1 uses `"PreSignup"` (lowercase 'u') while the Cognito API uses `"PreSignUp"`
 * (uppercase 'U'). Most trigger names are identical between Gen1 and Cognito, so
 * only the differing ones need to be listed here. Unlisted names pass through as-is.
 */
const GEN1_TO_COGNITO_TRIGGER_NAME: Record<string, string> = {
  PreSignup: 'PreSignUp',
};

/**
 * Maps Gen1 social provider names (from `cli-inputs.json` `authProvidersUserPool`)
 * to Cognito `IdentityProviderTypeType` enum values.
 *
 * Gen1 stores provider names like `"Facebook"`, `"Google"`, `"LoginWithAmazon"`,
 * `"SignInWithApple"` in the `authProvidersUserPool` array. The Cognito API uses
 * its own enum values (which happen to match for these providers).
 */
const GEN1_TO_COGNITO_PROVIDER_TYPE: Record<string, idp.IdentityProviderTypeType> = {
  Facebook: idp.IdentityProviderTypeType.Facebook,
  Google: idp.IdentityProviderTypeType.Google,
  LoginWithAmazon: idp.IdentityProviderTypeType.LoginWithAmazon,
  SignInWithApple: idp.IdentityProviderTypeType.SignInWithApple,
};

/**
 * Normalizes username attributes from `cli-inputs.json` into the format
 * returned by the real Cognito API.
 *
 * Gen1 sometimes stores username attributes as a single comma-separated
 * string inside an array (e.g., `["email, phone_number"]`) instead of
 * separate array entries (`["email", "phone_number"]`). The real Cognito
 * `DescribeUserPool` API always returns them as separate strings, so this
 * function splits and trims to match that behavior.
 */
function normalizeUsernameAttributes(raw: string[]): string[] {
  return raw.flatMap((entry: string) => entry.split(',').map((s: string) => s.trim()));
}

/**
 * Mock for the Amazon Cognito Identity Provider (User Pools) service client
 * (`@aws-sdk/client-cognito-identity-provider`).
 *
 * This is the most feature-rich mock because Cognito User Pools have extensive
 * configuration that the migration codegen needs to read and translate to Gen2.
 *
 * Mocks six commands:
 *
 * - `DescribeUserPoolCommand`: Returns user pool configuration including email
 *   verification settings, schema attributes, username attributes, Lambda triggers,
 *   and password policy.
 *
 * - `GetUserPoolMfaConfigCommand`: Returns MFA configuration (`OFF`, `ON`, or
 *   `OPTIONAL`) from `cli-inputs.json` at `cognitoConfig.mfaConfiguration`.
 *
 * - `DescribeUserPoolClientCommand`: Returns app client configuration including
 *   refresh token validity, OAuth settings (redirect URLs, flows, scopes), and
 *   supported identity providers.
 *
 * - `ListIdentityProvidersCommand`: Returns the list of configured social identity
 *   providers (Facebook, Google, Login with Amazon, Sign in with Apple).
 *
 * - `DescribeIdentityProviderCommand`: Returns details for a specific social
 *   provider including attribute mappings and authorize scopes.
 *
 * - `ListGroupsCommand`: Returns user pool groups with precedence values.
 *
 * Source files:
 * - `auth/<authName>/cli-inputs.json`: Most configuration values
 * - `auth/<authName>/build/<authName>-cloudformation-template.json`: Schema attributes,
 *   SupportedIdentityProviders on UserPoolClient
 * - `amplify-meta.json`: Lambda function ARNs for triggers
 */
export class CognitoIdentityProviderMock {
  public readonly mock;

  constructor(private readonly app: MigrationApp) {
    this.mock = mockClient(idp.CognitoIdentityProviderClient);
    this.mockDescribeUserPool();
    this.mockGetUserPoolMfaConfig();
    this.mockDescribeUserPoolClient();
    this.mockListIdentityProviders();
    this.mockDescribeIdentityProvider();
    this.mockListGroups();
  }

  private mockDescribeUserPool() {
    this.mock
      .on(idp.DescribeUserPoolCommand)
      .callsFake(async (input: idp.DescribeUserPoolCommandInput): Promise<idp.DescribeUserPoolCommandOutput> => {
        const authResourceName = this.app.resourceName({
          category: 'auth',
          service: 'Cognito',
          outputKey: 'UserPoolId',
          outputValue: input.UserPoolId!,
        });
        const stackName = this.app.clients.cloudformation.stackNameForResource(input.UserPoolId!);
        const templatePath = this.app.templatePathForStack(stackName);
        const template = JSONUtilities.readJson<any>(templatePath);
        const authCliInputs = this.app.cliInputsForResource(authResourceName, 'auth');

        // Build LambdaConfig from triggers in cli-inputs.json.
        // Each trigger key (e.g., "PreSignup") maps to a Lambda function whose
        // name follows the convention: <authResourceName><triggerName>.
        const lambdaConfig: Record<string, string> = {};
        const triggers = authCliInputs.cognitoConfig.triggers;
        if (triggers && typeof triggers === 'object') {
          for (const triggerName of Object.keys(triggers)) {
            const cognitoTriggerName = GEN1_TO_COGNITO_TRIGGER_NAME[triggerName] ?? triggerName;
            const functionName = `${authResourceName}${triggerName}`;
            const functionArn = this.app.meta.function?.[functionName]?.output?.Arn;
            if (functionArn) {
              lambdaConfig[cognitoTriggerName] = functionArn;
            }
          }
        }

        const usernameAttributes: string[] = authCliInputs.cognitoConfig.usernameAttributes ?? [];
        return {
          UserPool: {
            Id: input.UserPoolId,
            EmailVerificationMessage: authCliInputs.cognitoConfig.emailVerificationMessage,
            EmailVerificationSubject: authCliInputs.cognitoConfig.emailVerificationSubject,
            SchemaAttributes: template.Resources.UserPool.Properties.Schema,
            UsernameAttributes: normalizeUsernameAttributes(usernameAttributes) as idp.UsernameAttributeType[],
            LambdaConfig: lambdaConfig,
            Policies: {
              PasswordPolicy: {
                MinimumLength: authCliInputs.cognitoConfig.passwordPolicyMinLength,
                RequireUppercase: false,
                RequireLowercase: false,
                RequireNumbers: false,
                RequireSymbols: false,
                TemporaryPasswordValidityDays: 7,
              },
            },
          },
          $metadata: {},
        };
      });
  }

  private mockGetUserPoolMfaConfig() {
    this.mock
      .on(idp.GetUserPoolMfaConfigCommand)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .callsFake(async (input: idp.GetUserPoolMfaConfigCommandInput): Promise<idp.GetUserPoolMfaConfigCommandOutput> => {
        const authResourceName = this.app.singleResourceName('auth', 'Cognito');
        const authCliInputs = this.app.cliInputsForResource(authResourceName, 'auth');
        return {
          SoftwareTokenMfaConfiguration: { Enabled: false },
          MfaConfiguration: authCliInputs.cognitoConfig.mfaConfiguration,
          $metadata: {},
        };
      });
  }

  private mockDescribeUserPoolClient() {
    this.mock
      .on(idp.DescribeUserPoolClientCommand)
      .callsFake(async (input: idp.DescribeUserPoolClientCommandInput): Promise<idp.DescribeUserPoolClientCommandOutput> => {
        const authResourceName = this.app.singleResourceName('auth', 'Cognito');
        const authCliInputs = this.app.cliInputsForResource(authResourceName, 'auth');
        const logicalId = `auth${authResourceName}`;
        const nestedStackName = this.app.nestedStackName(this.app.rootStackName, logicalId);
        const templatePath = this.app.templatePathForStack(nestedStackName);
        const template = JSONUtilities.readJson<any>(templatePath);

        // Parse OAuth metadata from cli-inputs.json when present.
        const oAuthMetadata = authCliInputs.cognitoConfig.oAuthMetadata
          ? (JSON.parse(authCliInputs.cognitoConfig.oAuthMetadata) as {
              readonly AllowedOAuthFlows?: string[];
              readonly AllowedOAuthScopes?: string[];
              readonly CallbackURLs?: string[];
              readonly LogoutURLs?: string[];
            })
          : undefined;

        // Read SupportedIdentityProviders from the auth CloudFormation template.
        // Both UserPoolClient and UserPoolClientWeb have this property when social
        // providers are configured.
        const nativeClientProps = template.Resources.UserPoolClient?.Properties;
        const supportedIdentityProviders: string[] | undefined = nativeClientProps?.SupportedIdentityProviders;

        const innerAuthResourceName = this.app.singleResourceName('auth', 'Cognito');
        const innerAuthCliInputs = this.app.cliInputsForResource(innerAuthResourceName, 'auth');

        const baseClient: idp.UserPoolClientType = {
          ClientId: input.ClientId,
          RefreshTokenValidity: Number(innerAuthCliInputs.cognitoConfig.userpoolClientRefreshTokenValidity),
          TokenValidityUnits: { RefreshToken: 'days' },
          EnableTokenRevocation: true,
          EnablePropagateAdditionalUserContextData: false,
          AuthSessionValidity: 3,
        };

        // Include SupportedIdentityProviders when present in the template.
        // Must appear before OAuth properties to match real API property order.
        if (supportedIdentityProviders) {
          baseClient.SupportedIdentityProviders = supportedIdentityProviders;
        }

        // When OAuth is configured, include redirect URLs, flows, scopes, and the
        // OAuth flag. Property order must match the real Cognito API response.
        if (oAuthMetadata) {
          baseClient.CallbackURLs = oAuthMetadata.CallbackURLs;
          baseClient.LogoutURLs = oAuthMetadata.LogoutURLs;
          baseClient.AllowedOAuthFlows = oAuthMetadata.AllowedOAuthFlows as idp.OAuthFlowType[] | undefined;
          baseClient.AllowedOAuthScopes = oAuthMetadata.AllowedOAuthScopes;
        }
        baseClient.AllowedOAuthFlowsUserPoolClient = oAuthMetadata !== undefined;

        return {
          UserPoolClient: baseClient,
          $metadata: {},
        };
      });
  }

  private mockListIdentityProviders() {
    this.mock
      .on(idp.ListIdentityProvidersCommand)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .callsFake(async (input: idp.ListIdentityProvidersCommandInput): Promise<idp.ListIdentityProvidersCommandOutput> => {
        const authResourceName = this.app.singleResourceName('auth', 'Cognito');
        const authCliInputs = this.app.cliInputsForResource(authResourceName, 'auth');

        // Build identity provider list from authProvidersUserPool in cli-inputs.json.
        const authProviders: string[] = authCliInputs.cognitoConfig.authProvidersUserPool ?? [];

        const providers: idp.ProviderDescription[] = authProviders
          .filter((name: string) => name in GEN1_TO_COGNITO_PROVIDER_TYPE)
          .map((name: string) => ({
            ProviderName: name,
            ProviderType: GEN1_TO_COGNITO_PROVIDER_TYPE[name],
          }));
        return {
          Providers: providers,
          $metadata: {},
        };
      });
  }

  private mockDescribeIdentityProvider() {
    this.mock
      .on(idp.DescribeIdentityProviderCommand)
      .callsFake(async (input: idp.DescribeIdentityProviderCommandInput): Promise<idp.DescribeIdentityProviderCommandOutput> => {
        const authResourceName = this.app.singleResourceName('auth', 'Cognito');
        const authCliInputs = this.app.cliInputsForResource(authResourceName, 'auth');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hostedUIProviderMeta: any[] = authCliInputs.cognitoConfig.hostedUIProviderMeta
          ? JSON.parse(authCliInputs.cognitoConfig.hostedUIProviderMeta)
          : [];

        // Build a lookup from provider name to its metadata for DescribeIdentityProviderCommand.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const providerMetaByName = new Map<string, any>(hostedUIProviderMeta.map((entry) => [entry.ProviderName, entry]));

        const providerName = input.ProviderName!;
        const providerType = GEN1_TO_COGNITO_PROVIDER_TYPE[providerName];
        const meta = providerMetaByName.get(providerName);

        // Build attribute mapping in Cognito API format (cognito attr → provider attr).
        const attributeMapping: Record<string, string> = {};
        if (meta?.AttributeMapping) {
          for (const [cognitoAttr, providerAttr] of Object.entries(meta.AttributeMapping)) {
            attributeMapping[cognitoAttr] = String(providerAttr);
          }
        }

        return {
          IdentityProvider: {
            ProviderName: providerName,
            ProviderType: providerType,
            AttributeMapping: attributeMapping,
            ProviderDetails: meta ? { authorize_scopes: meta.authorize_scopes } : {},
          },
          $metadata: {},
        };
      });
  }

  private mockListGroups() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.mock.on(idp.ListGroupsCommand).callsFake(async (input: idp.ListGroupsCommandInput): Promise<idp.ListGroupsCommandOutput> => {
      const authResourceName = this.app.singleResourceName('auth', 'Cognito');
      const authCliInputs = this.app.cliInputsForResource(authResourceName, 'auth');
      const userPoolGroupList: string[] = authCliInputs.cognitoConfig.userPoolGroupList ?? [];

      return {
        Groups: userPoolGroupList.map((groupName: string, index: number) => ({ GroupName: groupName, Precedence: index + 1 })),
        $metadata: {},
      };
    });
  }
}
