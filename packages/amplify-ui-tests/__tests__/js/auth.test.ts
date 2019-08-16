import {
  initProjectWithProfile,
  deleteProject,
  amplifyPush
} from '../../src/init';

import { createNewProjectDir, deleteProjectDir, createTestMetaFile, getUITestConfig } from '../../src/utils';
import { addAuthWithDefault } from '../../src/categories/auth';
import { existsAWSExportsPath, copyAWSExportsToProj} from '../../src/utils/projectMeta';
import { runCypressTest, startServer, closeServer, gitCloneSampleApp, buildApp, signUpNewUser, setupCypress } from '../../src/utils/command'
import { join } from 'path';


describe('Auth tests in Javascript SDK:', () => {
  let projRoot: string;
  let destRoot: string;
  const { Auth, gitRepo } = getUITestConfig();
  const AUTH_PORT_NUMBER: string = Auth.port;
  const JS_SAMPLE_APP_REPO: string = gitRepo;

  describe('Simple Auth UI test:', async () => {

    const { apps } = Auth.simpleAuth;
    let settings = {};

    beforeAll(async () => {
      projRoot = createNewProjectDir(); // create a new project for each test
      jest.setTimeout(1000 * 60 * 60); // 1 hour timeout as pushing might be slow
      await gitCloneSampleApp(projRoot, {repo: JS_SAMPLE_APP_REPO});
      destRoot = projRoot + '/amplify-js-samples-staging';
      await setupCypress(destRoot);
    });

    afterAll(async () => {
      await deleteProject(projRoot, true, true); // delete the project from the cloud
      deleteProjectDir(projRoot); // delete the project directory
    });

    it('should set up amplify backend and generate aws-export.js file', async () => {
      await initProjectWithProfile(projRoot, {}, true);
      await addAuthWithDefault(projRoot, {}, true);
      await amplifyPush(projRoot, true); // Push it to the cloud
      expect(existsAWSExportsPath(projRoot, 'js')).toBeTruthy();
    });

    it('should have user pool in backend and sign up a user for test', async () => {
      settings = await signUpNewUser(projRoot);
    })


    describe('Run UI tests on JS app', async () => {
      let appPort = AUTH_PORT_NUMBER;
      afterEach(async () => {
        closeServer({port: appPort});
      })
      for (let i = 0; i < apps.length; i++) {
        it('should pass all UI tests on app <' + apps[i].name + '>', async () => {
          const appRoot = join(destRoot, apps[i].path);
          appPort = apps[i].port ? apps[i].port : AUTH_PORT_NUMBER;
          copyAWSExportsToProj(projRoot, appRoot);
          await createTestMetaFile(destRoot, {...settings, port: appPort, name: apps[i].name, testFiles: apps[i].testFiles});
          await buildApp(appRoot);
          await startServer(appRoot, {port: appPort});
          await runCypressTest(destRoot).then(isPassed => expect(isPassed).toBeTruthy())
        });
      }
    })
  })
});
