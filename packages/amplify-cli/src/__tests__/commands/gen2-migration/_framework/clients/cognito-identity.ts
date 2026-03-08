import { mockClient } from 'aws-sdk-client-mock';
import * as cognito from '@aws-sdk/client-cognito-identity';
import { MigrationApp } from '../app';

/**
 * Mock for the Amazon Cognito Identity service client (`@aws-sdk/client-cognito-identity`).
 *
 * Mocks one command:
 *
 * - `DescribeIdentityPoolCommand`: Returns the identity pool configuration including
 *   whether unauthenticated identities are allowed and the pool name.
 *
 * In Gen1, the identity pool is tightly coupled with the auth resource. The
 * `allowUnauthenticatedIdentities` flag determines whether guest access is enabled
 * in the Gen2 output. The identity pool name comes from `amplify-meta.json` auth
 * output.
 *
 * Source files:
 * - `auth/<authName>/cli-inputs.json`: `cognitoConfig.allowUnauthenticatedIdentities`
 * - `amplify-meta.json`: `auth.<authName>.output.IdentityPoolName`
 */
export class CognitoIdentityMock {
  public readonly mock;

  constructor(private readonly app: MigrationApp) {
    this.mock = mockClient(cognito.CognitoIdentityClient);
    this.mockDescribeIdentityPool();
  }

  private mockDescribeIdentityPool() {
    this.mock
      .on(cognito.DescribeIdentityPoolCommand)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .callsFake(async (input: cognito.DescribeIdentityPoolCommandInput): Promise<cognito.DescribeIdentityPoolCommandOutput> => {
        const authResourceName = this.app.singleResourceName('auth');
        const authCliInputs = this.app.cliInputsForResource(authResourceName, 'auth');

        return {
          AllowUnauthenticatedIdentities: authCliInputs.cognitoConfig.allowUnauthenticatedIdentities,
          IdentityPoolName: this.app.meta.auth[authResourceName].output.IdentityPoolName,
          IdentityPoolId: input.IdentityPoolId,
          $metadata: {},
        };
      });
  }
}
