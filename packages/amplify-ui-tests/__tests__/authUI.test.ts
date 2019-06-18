require('../src/aws-matchers/'); // custom matcher for assertion
import {
  initProjectWithProfile,
  deleteProject,
  amplifyPush
} from '../src/init';

import { createNewProjectDir, deleteProjectDir, getSampleRootPath, getProjectMeta, getUserPool } from '../src/utils';
import { addAuthWithDefault } from '../src/categories/auth';
import { existsAWSExportsPath, copyAWSExportsToProj } from '../src/utils/projectMeta';
import { runCypressTest } from '../src/utils/runCypressTest'


describe('amplify authUI test', () => {
  let projRoot: string;
  let destRoot: string;

  describe('Run test on JS app:', async () => {

    beforeAll(() => {
      projRoot = createNewProjectDir(); // create a new project for each test
      destRoot = getSampleRootPath();
      jest.setTimeout(1000 * 60 * 60); // 1 hour timeout as pushing might be slow
    });

    afterAll(async () => {
      await deleteProject(projRoot); // delete the project from the cloud
      deleteProjectDir(projRoot); // delete the project directory
    });

    it('should set up amplify backend and generate aws-export.js file', async () => {
      await initProjectWithProfile(projRoot, {});
      await addAuthWithDefault(projRoot, {});
      await amplifyPush(projRoot); // Push it to the cloud
      expect(existsAWSExportsPath(projRoot)).toBeTruthy()
    });

    it('should pass all UI tests on React app', async () => {
      copyAWSExportsToProj(projRoot, destRoot, 'react', 'auth/amplify-authenticator');
      await runCypressTest(destRoot, {platform: 'react'}).then(isPassed => expect(isPassed).toBeTruthy())
    });
  })

  // it('Init the auth backend and run UI tests on JS app ', async () => {
  //   // await initProjectWithProfile(projRoot, {});
  //   // await addAuthWithDefault(projRoot, {});
  //   // await amplifyPush(projRoot); // Push it to the cloud


  //   //test if auth has been created in the cloud
  //   // const meta = getProjectMeta(projRoot);
  //   // const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
  //   // const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
  //   // await expect(userPool.UserPool).toBeDefined()

  //   // TODO - assertion to make sure the resources are pushed. Use matcher
  //   //test if aws-exports.js exists
  //   //expect(existsAWSExportsPath(projRoot)).toBeTruthy()

  //   //run UI test on react apps
  //   //copyAWSExportsToProj(projRoot, destRoot, 'react', 'auth/amplify-authenticator')
  //   //test if UI tests are all passed
  //   //await runCypressTest(destRoot, {platform: 'react'}).then(isPassed => expect(isPassed).toBeTruthy())

  //   //run UI test on angular app
  //   //copyAWSExportsToProj(projRoot, destRoot, 'angular', 'auth/amplify-authenticator')
  //   //await runCypressTest(destRoot, {platform: 'angular'})

  //   //run UI test on vue app
  //   // copyAWSExportsToProj(projRoot, destRoot, 'vue', 'auth/amplify-authenticator')
  //   // await runCypressTest(destRoot, {platform: 'vue'})
  // });
});