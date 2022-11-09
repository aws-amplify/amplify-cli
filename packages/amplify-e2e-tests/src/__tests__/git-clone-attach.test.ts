/**
 * Tests for headless init/pull workflows on git-clones projects
 * These tests should exercise workflows that hosting executes during backend builds
 */

import {
  addAuthWithMaxOptions,
  addFunction,
  amplifyPushAuth,
  buildOverrides,
  createNewProjectDir,
  deleteProject, deleteProjectDir,
  getProjectConfig,
  getTeamProviderInfo,
  gitChangedFiles,
  gitCleanFdx,
  gitCommitAll,
  gitInit,
  initJSProjectWithProfile,
  nonInteractiveInitAttach,
  nonInteractivePullAttach,
} from '@aws-amplify/amplify-e2e-core';
import { S3 } from 'aws-sdk';
import { getShortId, importS3 } from '../import-helpers';

describe('attach amplify to git-cloned project', () => {
  const envName = 'test';
  let projRoot: string;
  const s3Client = new S3();
  const importBucketName = `git-clone-test-bucket-${getShortId()}`;
  beforeAll(async () => {
    await s3Client.createBucket({ Bucket: importBucketName }).promise();
    projRoot = await createNewProjectDir('clone-test');
    await initJSProjectWithProfile(projRoot, { envName /* , disableAmplifyAppCreation: false */ });
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
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
    await s3Client.deleteBucket({ Bucket: importBucketName }).promise();
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
    await nonInteractiveInitAttach(projRoot, projectName, envName, categoriesConfig);
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
    gitCleanFdx(projRoot);

    // execute headless pull
    const categoriesConfig = {
      storage: {
        bucketName: importBucketName,
        region: importBucketRegion,
      },
    };
    await nonInteractivePullAttach(projRoot, projectName, envName, categoriesConfig);
    await buildOverrides(projRoot);

    // expect no file changes
    const changedFiles = await gitChangedFiles(projRoot);
    expect(changedFiles.length).toBe(0);
    expect(getTeamProviderInfo(projRoot)).toEqual(preCleanTpi);
  });
});
