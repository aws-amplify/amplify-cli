/**
 * Tests for headless init/pull workflows on git-cloned projects
 * These tests exercise workflows that hosting executes during backend builds
 */

import {
  addAuthWithMaxOptions,
  addFunction,
  amplifyPushAuth,
  buildOverrides,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAmplifyInitConfig,
  getAmplifyPullConfig,
  getAwsProviderConfig,
  getProjectConfig,
  getSocialProviders,
  getTeamProviderInfo,
  gitChangedFiles,
  gitCleanFdx,
  gitCommitAll,
  gitInit,
  initJSProjectWithProfile,
  nonInteractiveInitAttach,
  nonInteractivePullAttach,
} from '@aws-amplify/amplify-e2e-core';
import { S3Client, CreateBucketCommand, DeleteBucketCommand } from '@aws-sdk/client-s3';
import { getShortId, importS3 } from '../import-helpers';

describe('attach amplify to git-cloned project', () => {
  const envName = 'test';
  let projRoot: string;
  const s3Client = new S3Client();
  const importBucketName = `git-clone-test-bucket-${getShortId()}`;
  beforeAll(async () => {
    await s3Client.send(new CreateBucketCommand({ Bucket: importBucketName }));
    projRoot = await createNewProjectDir('clone-test');
    await initJSProjectWithProfile(projRoot, { envName, disableAmplifyAppCreation: false });
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        environmentVariables: {
          key: 'FOO_BAR',
          value: 'fooBar',
        },
      },
      'nodejs',
    );
    await addAuthWithMaxOptions(projRoot, {});
    await importS3(projRoot, importBucketName);
    await amplifyPushAuth(projRoot);
    await gitInit(projRoot);
    await gitCommitAll(projRoot);
  });

  afterAll(async () => {
    try {
      await deleteProject(projRoot);
      deleteProjectDir(projRoot);
    } finally {
      await s3Client.send(new DeleteBucketCommand({ Bucket: importBucketName }));
    }
  });

  test('headless init can be used to attach existing environment', async () => {
    const { projectName } = getProjectConfig(projRoot);
    const preCleanTpi = getTeamProviderInfo(projRoot);
    const importBucketRegion = (Object.values(preCleanTpi[envName].categories.storage)[0] as any).region;
    await gitCleanFdx(projRoot);

    // execute headless init
    const categoriesConfig = {
      storage: {
        bucketName: importBucketName,
        region: importBucketRegion,
      },
    };
    await nonInteractiveInitAttach(projRoot, getAmplifyInitConfig(projectName, envName), getAwsProviderConfig(), categoriesConfig);
    await buildOverrides(projRoot);

    // expect no file changes
    const changedFiles = await gitChangedFiles(projRoot);
    expect(changedFiles.length).toBe(0);
    expect(getTeamProviderInfo(projRoot)).toEqual(preCleanTpi);
  });

  test('headless pull can be used to attach existing environment', async () => {
    const { projectName } = getProjectConfig(projRoot);
    const preCleanTpi = getTeamProviderInfo(projRoot);
    const importBucketRegion = (Object.values(preCleanTpi[envName].categories.storage)[0] as any).region;
    const appId = preCleanTpi[envName].awscloudformation.AmplifyAppId;
    await gitCleanFdx(projRoot);

    const socialProviders = getSocialProviders();
    const categoriesConfig = {
      storage: {
        bucketName: importBucketName,
        region: importBucketRegion,
      },
      auth: {
        facebookAppIdUserPool: socialProviders.FACEBOOK_APP_ID,
        facebookAppSecretUserPool: socialProviders.FACEBOOK_APP_SECRET,
        googleAppIdUserPool: socialProviders.GOOGLE_APP_ID,
        googleAppSecretUserPool: socialProviders.GOOGLE_APP_SECRET,
        // eslint-disable-next-line spellcheck/spell-checker
        loginwithamazonAppIdUserPool: socialProviders.AMAZON_APP_ID,
        // eslint-disable-next-line spellcheck/spell-checker
        loginwithamazonAppSecretUserPool: socialProviders.AMAZON_APP_SECRET,
      },
    };

    // execute headless pull
    await nonInteractivePullAttach(projRoot, getAmplifyPullConfig(projectName, envName, appId), categoriesConfig);
    await buildOverrides(projRoot);

    // expect no file changes
    const changedFiles = await gitChangedFiles(projRoot);
    expect(changedFiles).toMatchInlineSnapshot(`
      [
        ".gitignore",
      ]
    `); // there is a .gitignore newline after pull
    expect(getTeamProviderInfo(projRoot)).toEqual(preCleanTpi);
  });
});
