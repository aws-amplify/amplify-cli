import {
  initProjectWithProfile,
  deleteProject,
  amplifyPush
} from '../src/init';

import { createNewProjectDir, deleteProjectDir, getSampleRootPath, getProjectMeta, getUserPool, createTestMetaFile } from '../src/utils';
import { addAuthWithDefault, signUpNewUser } from '../src/categories/auth';
import { existsAWSExportsPath, copyAWSExportsToProj, getAWSMeta } from '../src/utils/projectMeta';
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
      expect(existsAWSExportsPath(projRoot)).toBeTruthy();
    });

    it('should have user pool in backend and sign up a user for test', async () => {
      const awsMeta = getAWSMeta(projRoot);
      const userPoolId = awsMeta.aws_user_pools_id;
      const clientId = awsMeta.aws_user_pools_web_client_id;
      expect(userPoolId).toBeDefined();
      expect(clientId).toBeDefined();

      const settings = {
        username: 'test01',
        password: 'The#test1',
        email: 'lizeyutest01@amazon.com',
        phone: '6666666666',
        clientId: clientId,
        userPoolId: userPoolId
      };
      await signUpNewUser(projRoot, settings);
      await createTestMetaFile(destRoot, settings);
    })

    // run UI test on react app
    it('should pass all UI tests on React app', async () => {
      copyAWSExportsToProj(projRoot, destRoot, 'react', 'auth/amplify-authenticator');
      await runCypressTest(destRoot, {platform: 'react', category: 'auth'}).then(isPassed => expect(isPassed).toBeTruthy())
    });



    // run UI test on angular app
    it.skip('should pass all UI tests on Angular app', async () => {
      copyAWSExportsToProj(projRoot, destRoot, 'angular', 'auth/amplify-authenticator')
      await runCypressTest(destRoot, {platform: 'angular', category: 'auth'}).then(isPassed => expect(isPassed).toBeTruthy())
    })


    // run UI test on vue app
    it.skip('should pass all UI tests on Vue app', async () => {
      copyAWSExportsToProj(projRoot, destRoot, 'vue', 'auth/amplify-authenticator')
      await runCypressTest(destRoot, {platform: 'vue', category: 'auth'}).then(isPassed => expect(isPassed).toBeTruthy())
    });

  })
});