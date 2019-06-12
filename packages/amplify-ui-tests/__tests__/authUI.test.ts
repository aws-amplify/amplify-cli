require('../src/aws-matchers/'); // custom matcher for assertion
import {
  initProjectWithProfile,
  deleteProject,
  amplifyPushAuth
} from '../src/init';

import { createNewProjectDir, deleteProjectDir, getSampleRootPath, getProjectMeta, getUserPool } from '../src/utils';
import { addAuthWithDefault } from '../src/categories/auth';
import { existsAWSExportsPath, copyAWSExportsToProj } from '../src/utils/projectMeta';
import { runCypressTest } from '../src/utils/runCypressTest'


describe('amplify your test', () => {
  let projRoot: string;
  let destRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir(); // create a new project for each test
    destRoot = getSampleRootPath();
    jest.setTimeout(1000 * 60 * 60); // 1 hour timeout as pushing might be slow
  });

  afterEach(async () => {
    await deleteProject(projRoot); // delete the project from the cloud
    deleteProjectDir(projRoot); // delete the project directory
  });

  it('<your test>', async () => {
    await initProjectWithProfile(projRoot, { name: '<project-name>' });
    // add resources that you want to test
    await addAuthWithDefault(projRoot,{});
    await amplifyPushAuth(projRoot); // Push it to the cloud


    //test if auth has been created in the cloud
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    await expect(userPool.UserPool).toBeDefined()

    // TODO - assertion to make sure the resources are pushed. Use matcher
    //test if aws-exports.js exists
    expect(existsAWSExportsPath(projRoot)).toBeTruthy()

    //run UI test on react apps
    copyAWSExportsToProj(projRoot, destRoot, 'react', 'auth/amplify-authenticator')
    await runCypressTest(destRoot, {platform: 'react'})

    //run UI test on angular app
    //copyAWSExportsToProj(projRoot, destRoot, 'angular', 'auth/amplify-authenticator')
    //await runCypressTest(destRoot, {platform: 'angular'})

    //run UI test on vue app
    // copyAWSExportsToProj(projRoot, destRoot, 'vue', 'auth/amplify-authenticator')
    // await runCypressTest(destRoot, {platform: 'vue'})
  });
});