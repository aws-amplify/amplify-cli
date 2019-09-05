import {
    initProjectWithProfile,
    deleteProject,
    amplifyPushApi
  } from '../../src/init';
import { addStorageWithDefault } from '../../src/categories/storage';
import { createNewProjectDir, deleteProjectDir, createTestMetaFile, getUITestConfig } from '../../src/utils';
import { addAuthWithDefault } from '../../src/categories/auth';
import { copyAWSExportsToProj, existsAWSExportsPath } from '../../src/utils/projectMeta';
import { runCypressTest, gitCloneSampleApp, buildApp, startServer, closeServer, signUpNewUser, setupCypress } from '../../src/utils/command';
import { join } from 'path';
import { addApiWithSimpleModel } from '../../src/categories/api';

describe('Storage tests in Javascript SDK:', () => {
    let projRoot: string;
    let destRoot: string;
    const { Storage, gitRepo } = getUITestConfig();
    const STORAGE_PORT_NUMBER: string = Storage.port;
    const JS_SAMPLE_APP_REPO: string = gitRepo;

    describe('Simple Storage UI test:', async () => {

      const { apps } = Storage.simpleStorageWithGraphQL;
      let settings = {};

        beforeAll(async () => {
            projRoot = createNewProjectDir();
            jest.setTimeout(1000 * 60 * 60); // 1 hour
            await gitCloneSampleApp(projRoot, {repo: JS_SAMPLE_APP_REPO});
            destRoot = projRoot + '/amplify-js-samples-staging';
            await setupCypress(destRoot);
        });

        afterAll(async () => {
            await deleteProject(projRoot, true, true);
            deleteProjectDir(projRoot);
        });

        it('should set up amplify backend and generate aws-export.js file', async () => {
            await initProjectWithProfile(projRoot, {}, true);
            await addAuthWithDefault(projRoot, {}, true); // should add auth before add storage
            await addStorageWithDefault(projRoot, {}, true);
            await addApiWithSimpleModel(projRoot, {}, true);
            await amplifyPushApi(projRoot, true);
            expect(existsAWSExportsPath(projRoot, 'js')).toBeTruthy()
        });

        it('should have user pool in backend and sign up a user for test', async () => {
          settings = await signUpNewUser(projRoot);
        })

        describe('Run UI tests on JS app', async () => {
          let appPort = STORAGE_PORT_NUMBER;
          afterEach(async () => {
            closeServer({port: appPort});
          });

          for (let i = 0; i < apps.length; i++) {
            it(`should pass all UI tests on app <${apps[i].name}>`, async () => {
              const appRoot = join(destRoot, apps[i].path);
              appPort = apps[i].port ? apps[i].port : STORAGE_PORT_NUMBER;
              copyAWSExportsToProj(projRoot, appRoot);
              await createTestMetaFile(destRoot, {...settings, port: appPort, name: apps[i].name, testFiles: apps[i].testFiles});
              await buildApp(appRoot);
              await startServer(appRoot, {port: appPort});
              await runCypressTest(destRoot).then(isPassed => expect(isPassed).toBeTruthy());
            });
          }
        });
    });
})
