import {
  addCDKCustomResource,
  addCFNCustomResource,
  addSimpleDDB,
  amplifyPushAuth,
  buildCustomResources,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
  useLatestExtensibilityHelper,
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
    await initJSProjectWithProfile(projRoot, { envName });
    await gitInit(projRoot);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('export custom storage types', async () => {
    await addAuthWithDefault(projRoot, {});
    await addS3WithGuestAccess(projRoot, {});
    await amplifyPushAuth(projRoot);

    console.log('LINE 44');

    const appId = getAppId(projRoot);
    const cdkResourceName = `custom${uuid().split('-')[0]}`;
    await addCDKCustomResource(projRoot, { name: cdkResourceName });
    const srcCustomResourceFilePath = path.join(__dirname, '..', '..', 'custom-resources', 'custom-cdk-stack-with-storage.ts');
    const destCustomResourceFilePath = path.join(projRoot, 'amplify', 'backend', 'custom', cdkResourceName, 'cdk-stack.ts');
    fs.copyFileSync(srcCustomResourceFilePath, destCustomResourceFilePath);
    await buildCustomResources(projRoot);
    await amplifyPushAuth(projRoot);

    console.log('LINE 52');

    await gitCleanFdx(projRoot);
    await initHeadless(projRoot, appId, envName, {});
    const typesPath = path.join(projRoot, 'amplify', 'backend', 'types', 'amplify-dependent-resources-ref.d.ts');
    const typesFileJSON = JSONUtilities.readJson(typesPath);
    const keys = Object.keys(typesFileJSON);
    expect('auth' in keys && 'custom' in keys && 'storage' in keys).toBeTruthy();
  });
});
