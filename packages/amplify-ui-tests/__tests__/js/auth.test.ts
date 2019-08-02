import {
  initProjectWithProfile,
  deleteProject,
  amplifyPush
} from '../../src/init';

import { createNewProjectDir, deleteProjectDir, createTestMetaFile } from '../../src/utils';
import { addAuthWithDefault, signUpNewUser } from '../../src/categories/auth';
import { existsAWSExportsPath, copyAWSExportsToProj} from '../../src/utils/projectMeta';
import { runCypressTest, startServer, closeServer, gitCloneSampleApp, buildApp } from '../../src/utils/command'


describe('Javascript SDK:', () => {
  let projRoot: string;
  let destRoot: string;
  const AUTH_PORT_NUMBER: string = '3001';
  const JS_SAMPLE_APP_REPO: string = 'https://github.com/AaronZyLee/photo-albums.git';

  describe('Simple Auth UI test:', async () => {

    beforeAll(async () => {
      projRoot = createNewProjectDir(); // create a new project for each test
      jest.setTimeout(1000 * 60 * 60); // 1 hour timeout as pushing might be slow
      await gitCloneSampleApp(projRoot, {repo: JS_SAMPLE_APP_REPO});
      destRoot = projRoot + '/photo-albums';
    });

    afterAll(async () => {
      await deleteProject(projRoot); // delete the project from the cloud
      deleteProjectDir(projRoot); // delete the project directory
    });

    it('should set up amplify backend and generate aws-export.js file', async () => {
      await initProjectWithProfile(projRoot, {});
      await addAuthWithDefault(projRoot, {});
      await amplifyPush(projRoot); // Push it to the cloud
      expect(existsAWSExportsPath(projRoot, 'js')).toBeTruthy();
    });

    it('should have user pool in backend and sign up a user for test', async () => {
      const settings = await signUpNewUser(projRoot);
      await createTestMetaFile(destRoot, {...settings, port: AUTH_PORT_NUMBER, category: "auth"});
    })


    describe('Run UI tests on JS app', async () => {
      afterEach(async () => {
        await closeServer(destRoot, {port: AUTH_PORT_NUMBER});
      })
      // run UI test on react app
      it('should pass all UI tests on React app', async () => {
        copyAWSExportsToProj(projRoot, destRoot, 'react', 'auth/amplify-authenticator');
        await buildApp(destRoot, {});
        await startServer(destRoot, {category: 'auth'});
        await runCypressTest(destRoot, {platform: 'react', category: 'auth'}).then(isPassed => expect(isPassed).toBeTruthy())
      });



      // run UI test on angular app
      it('should pass all UI tests on Angular app', () => {
        //TODO: add angular tests
      })


      // run UI test on vue app
      it('should pass all UI tests on Vue app', () => {
        //TODO: add vue tests
      });
    })
  })
});