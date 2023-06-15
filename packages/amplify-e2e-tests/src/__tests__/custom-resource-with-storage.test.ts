import {
  addCDKCustomResource,
  amplifyPushAuth,
  buildCustomResources,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  gitInit,
  gitCleanFdX,
  initHeadless,
  getAppId,
  addAuthWithDefault,
  addS3WithGuestAccess,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

describe('adding custom resources test', () => {
  const projectName = 'cusres';
  let projRoot: string;
  const envName = 'dev';
  beforeEach(async () => {
    projRoot = await createNewProjectDir(projectName);
    await initJSProjectWithProfile(projRoot, { envName, disableAmplifyAppCreation: false });
    await gitInit(projRoot);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it.only('verify export custom storage types', async () => {
    console.log('here 1');
    await addAuthWithDefault(projRoot);
    console.log('here 2');
    await addS3WithGuestAccess(projRoot);
    console.log('here 3');
    const appId = getAppId(projRoot);
    console.log('here 4');
    const cdkResourceName = `c${uuid().split('-')[0]}`;
    console.log('here 5');
    await addCDKCustomResource(projRoot, { name: cdkResourceName });
    console.log('here 6');
    const srcCustomResourceFilePath = path.join(__dirname, '..', '..', 'custom-resources', 'custom-cdk-stack-with-storage.ts');
    console.log('here 7');
    const destCustomResourceFilePath = path.join(projRoot, 'amplify', 'backend', 'custom', cdkResourceName, 'cdk-stack.ts');
    console.log('here 8');
    fs.copyFileSync(srcCustomResourceFilePath, destCustomResourceFilePath);
    console.log('here 9');
    await buildCustomResources(projRoot);
    console.log('here 10');
    await amplifyPushAuth(projRoot);
    console.log('here 11');
    await gitCleanFdX(projRoot);
    console.log('here 12');
    await initHeadless(projRoot, envName, appId);
    console.log('here 13');
    const typesPath = path.join(projRoot, 'amplify', 'backend', 'types', 'amplify-dependent-resources-ref.d.ts');
    console.log('here 14');
    const typesFileContents = await fs.readFile(typesPath, 'utf-8');
    console.log('here 15');
    const jsonObj = JSON.parse(typesFileContents.split('=')[1]);
    console.log('here 16');
    const jsonObjKeys = Object.keys(jsonObj);
    console.log('here 17');
    expect(jsonObjKeys.includes('auth')).toBeTruthy();
    console.log('here 18');
    expect(jsonObjKeys.includes('storage')).toBeTruthy();
    console.log('here 19');
  });
});
