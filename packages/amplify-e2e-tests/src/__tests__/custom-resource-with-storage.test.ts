import {
  addCDKCustomResource,
  amplifyPushAuth,
  buildCustomResources,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  gitInit,
  gitCleanFdx,
  initHeadless,
  getAppId,
  addAuthWithDefault,
  addS3WithGuestAccess,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { JSONUtilities } from 'amplify-cli-core';

describe('adding custom resources test', () => {
  let projRoot: string;
  const envName = 'dev';
  beforeEach(async () => {
    projRoot = await createNewProjectDir('custom-resources');
    await initJSProjectWithProfile(projRoot, { envName, disableAmplifyAppCreation: false });
    await gitInit(projRoot);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('export custom storage types', async () => {
    let i = 0;
    await addAuthWithDefault(projRoot, {});
    console.log(`POINT: ${++i}`);
    await addS3WithGuestAccess(projRoot, {});
    console.log(`POINT: ${++i}`);
    const appId = getAppId(projRoot);
    console.log(`POINT: ${++i}`);
    const cdkResourceName = `custom${uuid().split('-')[0]}`;
    console.log(`POINT: ${++i}`);
    await addCDKCustomResource(projRoot, { name: cdkResourceName });
    console.log(`POINT: ${++i}`);
    const srcCustomResourceFilePath = path.join(__dirname, '..', '..', 'custom-resources', 'custom-cdk-stack-with-storage.ts');
    console.log(`POINT: ${++i}`);
    const destCustomResourceFilePath = path.join(projRoot, 'amplify', 'backend', 'custom', cdkResourceName, 'cdk-stack.ts');
    console.log(`POINT: ${++i}`);
    fs.copyFileSync(srcCustomResourceFilePath, destCustomResourceFilePath);
    console.log(`POINT: ${++i}`);
    await buildCustomResources(projRoot);
    console.log(`POINT: ${++i}`);
    await amplifyPushAuth(projRoot);
    console.log(`POINT: ${++i}`);

    await gitCleanFdx(projRoot);
    console.log(`POINT: ${++i}`);
    await initHeadless(projRoot, appId, envName);
    console.log(`POINT: ${++i}`);
    const typesPath = path.join(projRoot, 'amplify', 'backend', 'types', 'amplify-dependent-resources-ref.d.ts');
    console.log(`POINT: ${++i}`);
    const typesFileJSON = JSONUtilities.readJson(typesPath);
    console.log(`POINT: ${++i}`);
    const keys = Object.keys(typesFileJSON);
    console.log(`POINT: ${++i}`);
    expect('auth' in keys && 'custom' in keys && 'storage' in keys).toBeTruthy();
  });
});
