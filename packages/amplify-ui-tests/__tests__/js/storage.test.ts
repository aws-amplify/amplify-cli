import {
    initProjectWithProfile,
    deleteProject,
    amplifyPush
  } from '../../src/init';
import { addStorageWithDefault } from '../../src/categories/storage';
import { createNewProjectDir, deleteProjectDir, createTestMetaFile } from '../../src/utils';
import { addAuthWithDefault, signUpNewUser } from '../../src/categories/auth';
import { copyAWSExportsToProj, existsAWSExportsPath } from '../../src/utils/projectMeta';
import { runCypressTest, gitCloneSampleApp, buildApp, startServer, closeServer } from '../../src/utils/command';

describe('Javascript SDK:', () => {
    let projRoot: string;
    let destRoot: string;
    const STORAGE_PORT_NUMBER: string = '3002';
    const JS_SAMPLE_APP_REPO: string = 'https://github.com/AaronZyLee/photo-albums.git';

    describe('Simple Storage UI test:', async () => {
        beforeAll(async () => {
            projRoot = createNewProjectDir();
            jest.setTimeout(1000 * 60 * 60); // 1 hour
            await gitCloneSampleApp(projRoot, {repo: JS_SAMPLE_APP_REPO});
            destRoot = projRoot + '/photo-albums';
        });

        afterAll(async () => {
            await deleteProject(projRoot);
            deleteProjectDir(projRoot);
        });

        it('should set up amplify backend and generate aws-export.js file', async () => {
            await initProjectWithProfile(projRoot, {});
            await addAuthWithDefault(projRoot, {}); // should add auth before add storage
            await addStorageWithDefault(projRoot, {});
            await amplifyPush(projRoot);
            expect(existsAWSExportsPath(projRoot, 'js')).toBeTruthy()
        });

        it('should have user pool in backend and sign up a user for test', async () => {
          const settings = await signUpNewUser(projRoot);
          await createTestMetaFile(destRoot, {...settings, port: STORAGE_PORT_NUMBER, category: "storage"});
        })

        describe('Run UI tests on JS app', async () => {
          afterEach(async () => {
            await closeServer(destRoot, {port: STORAGE_PORT_NUMBER});
          });

          //run UI test on react app
          it('should pass all UI tests on React app', async () => {
            copyAWSExportsToProj(projRoot, destRoot, 'react', 'auth/amplify-authenticator');
            await buildApp(destRoot, {});
            await startServer(destRoot, {category: 'storage'});
            await runCypressTest(destRoot, {platform: 'react', category: 'storage'}).then(isPassed => expect(isPassed).toBeTruthy());
          });
          // run UI test on angular app
          it('should pass all UI tests on Angular app', () => {
            //TODO: add angular tests
          })


          // run UI test on vue app
          it('should pass all UI tests on Vue app', () => {
            //TODO: add vue tests
          });
        });
    });
})