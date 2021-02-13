import * as path from 'path';
import {
  createNewProjectDir,
  initJSProjectWithProfile,
  deleteProject,
  deleteProjectDir,
  addApiWithSchema,
  addFeatureFlag,
  amplifyPush,
  updateApiSchema,
  amplifyPushUpdate,
  getAppId,
  amplifyPull,
  getProjectMeta,
  sleep,
} from 'amplify-e2e-core';
import S3 from 'aws-sdk/clients/s3';
import { DeploymentState, DeploymentStatus, JSONUtilities } from 'amplify-cli-core';

describe('Schema iterative update - locking', () => {
  let projectRoot: string;

  beforeAll(async () => {
    projectRoot = await createNewProjectDir('schemaIterativeLock');

    await initJSProjectWithProfile(projectRoot, {
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
    await addApiWithSchema(projectRoot, initialSchema, { apiName, apiKeyExpirationDays: 7 });
    await amplifyPush(projectRoot);

    // Apply updates to first project
    const finalSchema = path.join('iterative-push', 'change-model-name', 'final-schema.graphql');
    await updateApiSchema(projectRoot, apiName, finalSchema);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    let projectRootPull;

    projectRootPull = await createNewProjectDir('iterlock-pull');

    await amplifyPull(projectRootPull, { override: false, emptyDir: true, appId });

    // Apply modifications to second projects
    await updateApiSchema(projectRootPull, apiName, finalSchema);

    // Start push to have iterative updates
    const firstPush = amplifyPushUpdate(projectRoot);

    // Poll for the lock file in S3 to make sure test execution will be predictable
    const meta = getProjectMeta(projectRoot);
    const projectRegion = meta.providers.awscloudformation.Region;
    const deploymentBucketName = meta.providers.awscloudformation.DeploymentBucketName;

    const s3 = new S3({
      region: projectRegion,
    });

    let lockFileExists = false;
    let retry = 0;
    const maxRetries = 3;
    const retryDelay = 3000;
    const stateFileName: string = 'deployment-state.json';

    while (retry < maxRetries || !lockFileExists) {
      try {
        const deploymentStateObject = await s3
          .getObject({
            Bucket: deploymentBucketName,
            Key: stateFileName,
          })
          .promise();

        const deploymentState = JSONUtilities.parse<DeploymentState>(deploymentStateObject.Body.toString());

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
    const secondPush = amplifyPushUpdate(
      projectRootPull,
      /A deployment is already in progress for the project, cannot push resources until it finishes.*/,
    );

    await Promise.all([firstPush, secondPush]);

    deleteProjectDir(projectRootPull);
  });
});
