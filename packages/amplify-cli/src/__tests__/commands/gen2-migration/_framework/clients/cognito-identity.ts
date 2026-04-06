import { mockClient } from 'aws-sdk-client-mock';
import * as cognito from '@aws-sdk/client-cognito-identity';
import { MigrationApp } from '../app';

/**
 * Mock for the Amazon Cognito Identity service client (`@aws-sdk/client-cognito-identity`).
 *
 * Mocks two commands:
 *
 * - `DescribeIdentityPoolCommand`: Returns the identity pool configuration including
 *   whether unauthenticated identities are allowed and the pool name.
 *
 * - `GetIdentityPoolRolesCommand`: Returns the authenticated and unauthenticated IAM
 *   role ARNs attached to the identity pool. Used by `ReferenceAuthGenerator` for
 *   imported auth resources.
 *
 * In Gen1, the identity pool is tightly coupled with the auth resource. The
 * `allowUnauthenticatedIdentities` flag determines whether guest access is enabled
 * in the Gen2 output. The identity pool name comes from `amplify-meta.json` auth
 * output.
 *
 * For native auth resources, configuration is read from `cli-inputs.json`. For
 * imported auth resources (which lack `cli-inputs.json`), configuration is read
 * from `team-provider-info.json`.
 *
 * Source files:
 * - `auth/<authName>/cli-inputs.json`: `cognitoConfig.allowUnauthenticatedIdentities` (native auth)
 * - `team-provider-info.json`: `categories.auth.<authName>.*` (imported auth)
 * - `amplify-meta.json`: `auth.<authName>.output.IdentityPoolName`
 */
export class CognitoIdentityMock {
  public readonly mock;

  constructor(private readonly app: MigrationApp) {
    this.mock = mockClient(cognito.CognitoIdentityClient);
    this.mockDescribeIdentityPool();
    this.mockGetIdentityPoolRoles();
  }

  private mockDescribeIdentityPool() {
    this.mock
      .on(cognito.DescribeIdentityPoolCommand)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .callsFake(async (input: cognito.DescribeIdentityPoolCommandInput): Promise<cognito.DescribeIdentityPoolCommandOutput> => {
        const authResourceName = this.app.singleResourceName('auth', 'Cognito');
        const authMeta = this.app.meta.auth[authResourceName];

        // Imported auth resources don't have cli-inputs.json. Read the
        // identity pool configuration from team-provider-info instead.
        if (authMeta.serviceType === 'imported') {
          const tpiAuth = this.app.tpi[this.app.environmentName].categories.auth[authResourceName];
          return {
            AllowUnauthenticatedIdentities: tpiAuth.allowUnauthenticatedIdentities ?? false,
            IdentityPoolName: authMeta.output.IdentityPoolName,
            IdentityPoolId: input.IdentityPoolId,
            $metadata: {},
          };
        }

        const authCliInputs = this.app.cliInputsForResource(authResourceName, 'auth');
        return {
          AllowUnauthenticatedIdentities: authCliInputs.cognitoConfig.allowUnauthenticatedIdentities,
          IdentityPoolName: authMeta.output.IdentityPoolName,
          IdentityPoolId: input.IdentityPoolId,
          $metadata: {},
        };
      });
  }

  /**
   * Mocks `GetIdentityPoolRolesCommand` for imported auth resources.
   *
   * The `ReferenceAuthGenerator` calls `fetchIdentityPoolRoles` to discover
   * the authenticated and unauthenticated IAM role ARNs attached to the
   * identity pool. For imported resources these ARNs are stored in
   * `team-provider-info.json` under the auth category.
   */
  private mockGetIdentityPoolRoles() {
    this.mock
      .on(cognito.GetIdentityPoolRolesCommand)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .callsFake(async (_input: cognito.GetIdentityPoolRolesCommandInput): Promise<cognito.GetIdentityPoolRolesCommandOutput> => {
        const authResourceName = this.app.singleResourceName('auth', 'Cognito');
        const tpiAuth = this.app.tpi[this.app.environmentName].categories?.auth?.[authResourceName];

        const roles: Record<string, string> = {};
        if (tpiAuth?.authRoleArn) roles.authenticated = tpiAuth.authRoleArn;
        if (tpiAuth?.unauthRoleArn) roles.unauthenticated = tpiAuth.unauthRoleArn;

        return {
          Roles: Object.keys(roles).length > 0 ? roles : undefined,
          $metadata: {},
        };
      });
  }
}
