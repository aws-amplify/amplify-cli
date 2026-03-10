import { MigrationApp } from './app';
import { AmplifyMock } from './clients/amplify';
import { CloudFormationMock } from './clients/cloudformation';
import { LambdaMock } from './clients/lambda';
import { CognitoIdentityMock } from './clients/cognito-identity';
import { CognitoIdentityProviderMock } from './clients/cognito-identity-provider';
import { CloudWatchEventsMock } from './clients/cloudwatch-events';
import { AppSyncMock } from './clients/appsync';
import { S3Mock } from './clients/s3';
import { DynamoDBMock } from './clients/dynamodb';
import { STSMock } from './clients/sts';

/**
 * Orchestrates mock AWS SDK clients for all services the migration codegen calls.
 *
 * Each mock client is created by a dedicated class in the `clients/` directory.
 * The mocks use `aws-sdk-client-mock` to intercept SDK calls and return responses
 * derived from local files in the app's snapshot input directories
 * (`_snapshot.pre.generate/` and `_snapshot.pre.refactor/`). This means tests
 * run entirely offline — no AWS credentials or network access needed.
 *
 * The mock instances are exposed as public properties so that individual tests
 * can further customize responses via the `customize` callback:
 *
 * ```typescript
 * await testSnapshot('my-app', {}, async (app) => {
 *   // Override a specific command response for this test only
 *   app.clients.cognitoIdentityProvider
 *     .on(GetUserPoolMfaConfigCommand)
 *     .resolves({ MfaConfiguration: 'ON' });
 * });
 * ```
 *
 * When adding support for a new AWS service, create a new mock class in `clients/`
 * and register it here.
 */
export class MockClients {
  public readonly amplify: AmplifyMock;
  public readonly cloudformation: CloudFormationMock;
  public readonly lambda: LambdaMock;
  public readonly cognitoIdentityProvider: CognitoIdentityProviderMock;
  public readonly cognitoIdentity: CognitoIdentityMock;
  public readonly cwe: CloudWatchEventsMock;
  public readonly appsync: AppSyncMock;
  public readonly s3: S3Mock;
  public readonly dynamodb: DynamoDBMock;
  public readonly sts: STSMock;

  /**
   * Creates mock clients lazily for all supported AWS services.
   *
   * @param app - The MigrationApp instance providing access to local app files.
   */
  constructor(app: MigrationApp) {
    this.amplify = new AmplifyMock(app);
    this.cloudformation = new CloudFormationMock(app);
    this.lambda = new LambdaMock(app);
    this.cognitoIdentityProvider = new CognitoIdentityProviderMock(app);
    this.cognitoIdentity = new CognitoIdentityMock(app);
    this.cwe = new CloudWatchEventsMock(app);
    this.appsync = new AppSyncMock(app);
    this.s3 = new S3Mock(app);
    this.dynamodb = new DynamoDBMock(app);
    this.sts = new STSMock(app);
  }
}
