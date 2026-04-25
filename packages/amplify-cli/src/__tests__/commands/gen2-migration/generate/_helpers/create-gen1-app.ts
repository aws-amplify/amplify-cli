import { Gen1App } from '../../../../../commands/gen2-migration/generate/_infra/gen1-app';
import { AwsClients } from '../../../../../commands/gen2-migration/_infra/aws-clients';
import { JSONUtilities, stateManager, pathManager } from '@aws-amplify/amplify-cli-core';
import * as path from 'path';
import * as os from 'os';
import * as fsExtra from 'fs-extra';

/**
 * Creates a real Gen1App via Gen1App.create(), mocking only the external
 * dependencies (AWS clients, stateManager, S3 download). The amplify-meta.json
 * is written to a real temp directory so the constructor reads it normally.
 *
 * After construction, replaces `app.aws` with jest mocks for the fetcher methods
 * that the caller specifies via `awsMocks`. Any fetcher method not provided
 * defaults to a jest.fn() that throws "not mocked".
 */
export async function createGen1App(meta: Record<string, unknown>): Promise<Gen1App> {
  const envName = 'main';

  const ccbDir = fsExtra.mkdtempSync(path.join(os.tmpdir(), 'gen1app-test-'));
  JSONUtilities.writeJson(path.join(ccbDir, 'amplify-meta.json'), meta);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mocking private static method
  (Gen1App as any).downloadCloudBackend = jest.fn().mockResolvedValue(ccbDir);

  jest.spyOn(stateManager, 'teamProviderInfoExists').mockReturnValue(true);
  jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
    [envName]: { awscloudformation: { AmplifyAppId: 'test-app-id', StackName: 'test-stack', DeploymentBucketName: 'test-bucket' } },
  });
  jest.spyOn(stateManager, 'getCurrentEnvName').mockReturnValue(envName);
  jest.spyOn(pathManager, 'getTeamProviderInfoFilePath').mockReturnValue('/tmp/team-provider-info.json');

  jest.spyOn(AwsClients, 'create').mockResolvedValue({
    amplify: { send: jest.fn().mockResolvedValue({ app: { appId: 'test-app-id', name: 'test-app' } }) },
    s3: {},
  } as unknown as AwsClients);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- no real $TSContext needed
  const app = await Gen1App.create({} as any);

  // Replace the real AwsFetcher with a blank mock object.
  // Callers configure individual methods: (app.aws.fetchUserPool as jest.Mock).mockResolvedValue(...)
  (app as any).aws = {
    fetchUserPool: jest.fn().mockResolvedValue({ SchemaAttributes: [] }),
    fetchMfaConfig: jest.fn(),
    fetchUserPoolClient: jest.fn(),
    fetchIdentityProviders: jest.fn(),
    fetchIdentityGroups: jest.fn(),
    fetchIdentityPool: jest.fn(),
    fetchIdentityPoolRoles: jest.fn(),
    fetchGroupsByUserPoolId: jest.fn(),
    fetchFunctionConfig: jest.fn(),
    fetchFunctionSchedule: jest.fn().mockResolvedValue(undefined),
    fetchGraphqlApi: jest.fn(),
    fetchTableDescription: jest.fn(),
    fetchBucketAccelerate: jest.fn().mockResolvedValue(undefined),
    fetchBucketVersioning: jest.fn().mockResolvedValue(undefined),
    fetchBucketEncryption: jest.fn().mockResolvedValue(undefined),
    fetchBucketNotifications: jest.fn(),
    fetchRestApiRootResourceId: jest.fn().mockResolvedValue('root-resource-id'),
    fetchAppBuildSpec: jest.fn(),
  };

  return app;
}
