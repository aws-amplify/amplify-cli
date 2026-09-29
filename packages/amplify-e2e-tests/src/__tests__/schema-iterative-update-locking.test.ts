import * as path from 'path';
import {
  createNewProjectDir,
  initJSProjectWithProfile,
  deleteProject,
  deleteProjectDir,
  addApiWithoutSchema,
  addFeatureFlag,
  amplifyPush,
  updateApiSchema,
  amplifyPushUpdate,
  getAppId,
  amplifyPull,
  getProjectMeta,
  sleep,
} from '@aws-amplify/amplify-e2e-core';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DeploymentState, DeploymentStatus, JSONUtilities } from '@aws-amplify/amplify-cli-core';

describe('Schema iterative update - locking', () => {
  let projectRoot: string;

  beforeAll(async () => {
    projectRoot = await createNewProjectDir('schemaIterativeLock');

    await initJSProjectWithProfile(projectRoot, {
      name: 'iterlock',
      disableAmplifyAppCreation: false,
    });

    addFeatureFlag(projectRoot, 'graphqltransformer', 'enableiterativegsiupdates', true);
  });

  afterAll(async () => {
    await deleteProject(projectRoot);
    deleteProjectDir(projectRoot);
  });

  it('other push should fail due to locking', async () => {
    const apiName = 'iterlock';

    // Create and push project with API
    const initialSchema = path.join('iterative-push', 'change-model-name', 'initial-schema.graphql');
    await addApiWithoutSchema(projectRoot, { apiKeyExpirationDays: 7, transformerVersion: 1 });
    await updateApiSchema(projectRoot, apiName, initialSchema);
    await amplifyPush(projectRoot);

    // Apply updates to first project
    const finalSchema = path.join('iterative-push', 'change-model-name', 'final-schema.graphql');
    updateApiSchema(projectRoot, apiName, finalSchema);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    const projectRootPull = await createNewProjectDir('iterlock-pull');

    await amplifyPull(projectRootPull, { override: false, emptyDir: true, appId });

    // Apply modifications to second projects
    updateApiSchema(projectRootPull, apiName, finalSchema);

    // Start push to have iterative updates
    const firstPush = amplifyPushUpdate(projectRoot);

    // Poll for the lock file in S3 to make sure test execution will be predictable
    const meta = getProjectMeta(projectRoot);
    const projectRegion = meta.providers.awscloudformation.Region;
    const deploymentBucketName = meta.providers.awscloudformation.DeploymentBucketName;

    const s3 = new S3Client({
      region: projectRegion,
    });

    let lockFileExists = false;
    let retry = 0;
    const maxRetries = 3;
    const retryDelay = 3000;
    const stateFileName = 'deployment-state.json';

    while (retry < maxRetries || !lockFileExists) {
      try {
        const deploymentStateObject = await s3.send(
          new GetObjectCommand({
            Bucket: deploymentBucketName,
            Key: stateFileName,
          }),
        );

        const bodyString = await deploymentStateObject.Body?.transformToString();
        const deploymentState = JSONUtilities.parse<DeploymentState>(bodyString);

        if (deploymentState.status === DeploymentStatus.DEPLOYING) {
          lockFileExists = true;
          break;
        } else {
          retry++;

          await sleep(retryDelay);
        }
      } catch {
        // Intentionally left blank
      }
    }

    expect(lockFileExists).toBe(true);

    // Start second push and expect failure
    const secondPush = amplifyPushUpdate(projectRootPull, /A deployment is in progress.*/);

    await Promise.all([firstPush, secondPush]);

    deleteProjectDir(projectRootPull);
  });
});
