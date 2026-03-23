import * as apigw from '@aws-sdk/client-api-gateway';
import { mockClient } from 'aws-sdk-client-mock';
import { MigrationApp } from '../app';

/**
 * Mock for the AWS API Gateway client (`@aws-sdk/client-api-gateway`).
 *
 * Mocks one command:
 *
 * - `GetResourcesCommand`: Returns a root resource (path `/`) whose ID is
 *   `{restApiId}-root`. The migration codegen calls this to discover the root
 *   resource ID of a Gen1 REST API, which is needed to construct
 *   `RestApi.fromRestApiAttributes()` in the Gen2 output.
 *
 * The mock derives the root resource ID deterministically from the `restApiId`
 * input so that snapshot expectations are stable across runs.
 */
export class APIGatewayMock {
  public readonly mock;

  constructor(private readonly app: MigrationApp) {
    this.mock = mockClient(apigw.APIGatewayClient);
    this.mockGetResources();
  }

  private mockGetResources() {
    this.mock
      .on(apigw.GetResourcesCommand)
      .callsFake(async (input: apigw.GetResourcesCommandInput): Promise<apigw.GetResourcesCommandOutput> => {
        const restApiId = input.restApiId ?? 'unknown';
        return {
          items: [
            {
              id: `${restApiId}-root`,
              path: '/',
            },
          ],
          $metadata: {},
        };
      });
  }
}
