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
  /* TEMPORARY-PR12830: Remove after we ship PR12830 */
  useLatestExtensibilityHelper,
  /* END TEMPORARY */
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

describe('adding custom resources test', () => {
  const projectName = 'cusres';
  let projRoot: string;
  const envName = 'devtest';
  beforeEach(async () => {
    projRoot = await createNewProjectDir(projectName);
    await initJSProjectWithProfile(projRoot, { envName, disableAmplifyAppCreation: false });
    await gitInit(projRoot);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('verify export custom storage types', async () => {
    await addAuthWithDefault(projRoot);
    await addS3WithGuestAccess(projRoot);
    const appId = getAppId(projRoot);
    const cdkResourceName = `c${uuid().split('-')[0]}`;
    await addCDKCustomResource(projRoot, { name: cdkResourceName });
    const srcCustomResourceFilePath = path.join(__dirname, '..', '..', 'custom-resources', 'custom-cdk-stack-with-storage.ts');
    const destCustomResourceFilePath = path.join(projRoot, 'amplify', 'backend', 'custom', cdkResourceName, 'cdk-stack.ts');
    fs.copyFileSync(srcCustomResourceFilePath, destCustomResourceFilePath);
    /* TEMPORARY-PR12830: Remove after we ship PR12830
     * this is required to jump over breaking change between 2.68 and 2.80 of CDK.
     */
    useLatestExtensibilityHelper(projRoot, cdkResourceName);
    /* END TEMPORARY */
    await buildCustomResources(projRoot);
    await amplifyPushAuth(projRoot);
    await gitCleanFdX(projRoot);
    await initHeadless(projRoot, envName, appId);
    const typesPath = path.join(projRoot, 'amplify', 'backend', 'types', 'amplify-dependent-resources-ref.d.ts');
    const typesFileContents = await fs.readFile(typesPath, 'utf-8');
    const jsonObj = JSON.parse(typesFileContents.split('=')[1]);
    const jsonObjKeys = Object.keys(jsonObj);
    expect(jsonObjKeys.includes('auth')).toBeTruthy();
    expect(jsonObjKeys.includes('storage')).toBeTruthy();
  });
});
