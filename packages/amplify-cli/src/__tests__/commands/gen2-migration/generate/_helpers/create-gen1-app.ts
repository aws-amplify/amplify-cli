import { Gen1App } from '../../../../../commands/gen2-migration/_common/gen1-app';
import { AwsClients } from '../../../../../commands/gen2-migration/_common/aws-clients';
import { JSONUtilities, stateManager, pathManager } from '@aws-amplify/amplify-cli-core';
import * as path from 'path';
import * as os from 'os';
import * as fsExtra from 'fs-extra';

/**
 * Creates a real Gen1App via Gen1App.create(), mocking only the external
 * dependencies (AWS clients, stateManager, S3 download). The amplify-meta.json
 * is written to a real temp directory so the constructor reads it normally.
 *
 * The returned app has a real AwsFetcher backed by fake AwsClients. Tests must
 * use `jest.spyOn(app.aws, 'methodName').mockResolvedValue(...)` for every
 * fetcher method their code path calls.
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
  return Gen1App.create({} as any);
}
