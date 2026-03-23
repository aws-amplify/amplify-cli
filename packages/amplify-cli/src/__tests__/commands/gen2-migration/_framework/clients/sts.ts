import * as sts from '@aws-sdk/client-sts';
import { mockClient } from 'aws-sdk-client-mock';
import { MigrationApp } from '../app';

/**
 * Mock for the AWS STS (Security Token Service) client (`@aws-sdk/client-sts`).
 *
 * Mocks one command:
 *
 * - `GetCallerIdentityCommand`: Returns a hardcoded account ID (`123456789012`).
 *   The migration codegen calls this to determine the AWS account ID for
 *   constructing ARNs and resource identifiers in the Gen2 output.
 *
 * No local files are used — the account ID is a fixed test value.
 */
export class STSMock {
  public readonly mock;

  constructor(private readonly app: MigrationApp) {
    this.mock = mockClient(sts.STSClient);
    this.mockGetCallerIdentity();
  }

  private mockGetCallerIdentity() {
    this.mock
      .on(sts.GetCallerIdentityCommand)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .callsFake(async (input: sts.GetCallerIdentityCommandInput): Promise<sts.GetCallerIdentityCommandOutput> => {
        return {
          Account: '123456789012',
          $metadata: {},
        };
      });
  }
}
