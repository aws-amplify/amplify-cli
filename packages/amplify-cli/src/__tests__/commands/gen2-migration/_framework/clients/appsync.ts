import { mockClient } from 'aws-sdk-client-mock';
import * as appsync from '@aws-sdk/client-appsync';
import { MigrationApp } from '../app';

/**
 * Mock for the AWS AppSync service client (`@aws-sdk/client-appsync`).
 *
 * Mocks two commands used by the migration codegen:
 *
 * - `GetGraphqlApiCommand`: Returns the GraphQL API configuration including
 *   the default authentication type and any additional authentication providers.
 *   The default auth type comes from `cli-inputs.json` at
 *   `serviceConfiguration.defaultAuthType.mode` (e.g., `"AMAZON_COGNITO_USER_POOLS"`,
 *   `"API_KEY"`). Additional auth types are iterated from
 *   `serviceConfiguration.additionalAuthTypes[]`.
 *
 *   For `AMAZON_COGNITO_USER_POOLS` additional auth, the mock also includes the
 *   user pool ID from `amplify-meta.json` auth output. For `API_KEY`, no extra
 *   config is needed.
 *
 * - `ListGraphqlApisCommand`: Returns a single API entry with the API ID, name
 *   (following the Amplify convention `<resourceName>-<envName>`), and tags that
 *   identify the stack and application.
 *
 * Source files:
 * - `amplify-meta.json`: API ID (`output.GraphQLAPIIdOutput`), auth user pool ID
 * - `api/<apiName>/cli-inputs.json`: Default and additional auth types
 */
export class AppSyncMock {
  public readonly mock;

  constructor(private readonly app: MigrationApp) {
    this.mock = mockClient(appsync.AppSyncClient);
    this.mockGetGraphqlApi();
    this.mockListGraphqlApis();
  }

  private mockGetGraphqlApi() {
    this.mock
      .on(appsync.GetGraphqlApiCommand)
      .callsFake(async (input: appsync.GetGraphqlApiCommandInput): Promise<appsync.GetGraphqlApiCommandOutput> => {
        const apiResourceName = this.app.singleResourceName('api', 'AppSync');
        const authResourceName = this.app.singleResourceName('auth', 'Cognito');
        const cliInputs = this.app.cliInputsForResource(apiResourceName, 'api');
        const additionalAuthenticationProviders: appsync.AdditionalAuthenticationProvider[] = [];

        for (const aut of cliInputs.serviceConfiguration.additionalAuthTypes ?? []) {
          switch (aut.mode) {
            case 'AMAZON_COGNITO_USER_POOLS':
              additionalAuthenticationProviders.push({
                authenticationType: aut.mode,
                userPoolConfig: {
                  awsRegion: this.app.region,
                  userPoolId: this.app.meta.auth[authResourceName].output.UserPoolId,
                },
              });
              break;
            case 'API_KEY':
              additionalAuthenticationProviders.push({
                authenticationType: aut.mode,
              });
              break;
            default:
              throw new Error(`Unsupported additional auth mode: ${aut.mode}`);
          }
        }

        return {
          graphqlApi: {
            apiId: input.apiId,
            authenticationType: cliInputs.serviceConfiguration.defaultAuthType.mode,
            additionalAuthenticationProviders,
            logConfig: undefined,
          },
          $metadata: {},
        };
      });
  }

  private mockListGraphqlApis() {
    this.mock
      .on(appsync.ListGraphqlApisCommand)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .callsFake(async (input: appsync.ListGraphqlApisCommandInput): Promise<appsync.ListGraphqlApisCommandOutput> => {
        const apiResourceName = this.app.singleResourceName('api', 'AppSync');
        const apiId = this.app.meta.api[apiResourceName].output.GraphQLAPIIdOutput;
        return {
          graphqlApis: [
            {
              apiId,
              // this is how amplify names appsync APIs
              name: `${apiResourceName}-${this.app.environmentName}`,
              tags: {
                'user:Stack': this.app.environmentName,
                'user:Application': apiResourceName,
              },
            },
          ],
          $metadata: {},
        };
      });
  }
}
