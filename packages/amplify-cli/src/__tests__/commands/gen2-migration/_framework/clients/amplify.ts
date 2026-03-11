import { mockClient } from 'aws-sdk-client-mock';
import * as amplify from '@aws-sdk/client-amplify';
import { MigrationApp } from '../app';

/**
 * Mock for the AWS Amplify service client (`@aws-sdk/client-amplify`).
 *
 * Mocks two commands used by the migration codegen:
 *
 * - `GetBackendEnvironmentCommand`: Returns the stack name, deployment bucket,
 *   and environment name. These values come from `amplify-meta.json` at
 *   `providers.awscloudformation.*` and from `team-provider-info.json`.
 *
 * - `GetAppCommand`: Returns the app name, app ID, and build spec. The build
 *   spec is provided via `MigrationAppOptions.buildSpec` because it's configured
 *   in the Amplify Console (not stored in local files). Apps without hosting
 *   (backend-only) pass `undefined` for `buildSpec`, which causes the codegen
 *   to skip `amplify.yml` generation.
 *
 * Source files:
 * - `amplify-meta.json`: `StackName`, `DeploymentBucketName`, `AmplifyAppId`
 * - `team-provider-info.json`: environment name
 * - `MigrationAppOptions.buildSpec`: build spec YAML (test-provided)
 */
export class AmplifyMock {
  public readonly mock;

  constructor(private readonly app: MigrationApp) {
    this.mock = mockClient(amplify.AmplifyClient);
    this.mockGetBackendEnvironment();
    this.mockGetApp();
  }

  private mockGetBackendEnvironment() {
    this.mock
      .on(amplify.GetBackendEnvironmentCommand)
      .callsFake(async (input: amplify.GetBackendEnvironmentCommandInput): Promise<amplify.GetBackendEnvironmentCommandOutput> => {
        return {
          backendEnvironment: {
            stackName: this.app.meta.providers.awscloudformation.StackName,
            deploymentArtifacts: this.app.meta.providers.awscloudformation.DeploymentBucketName,
            environmentName: input.environmentName,
            backendEnvironmentArn: undefined,
            createTime: undefined,
            updateTime: undefined,
          },
          $metadata: {},
        };
      });
  }

  private mockGetApp() {
    this.mock.on(amplify.GetAppCommand).callsFake(async (input: amplify.GetAppCommandInput): Promise<amplify.GetAppCommandOutput> => {
      return {
        app: {
          name: this.app.name,
          appId: input.appId,
          appArn: undefined,
          repository: undefined,
          description: undefined,
          platform: undefined,
          createTime: undefined,
          updateTime: undefined,
          environmentVariables: undefined,
          defaultDomain: undefined,
          enableBasicAuth: undefined,
          enableBranchAutoBuild: undefined,
          buildSpec: this.app.options.buildSpec,
        },
        $metadata: {},
      };
    });
  }
}
