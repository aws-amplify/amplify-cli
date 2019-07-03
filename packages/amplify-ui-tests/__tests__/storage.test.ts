import {
    initProjectWithProfile,
    deleteProject,
    amplifyPush
  } from '../src/init';
import { addStorageWithDefault } from '../src/categories/storage';
import { createNewProjectDir, deleteProjectDir, existsAWSExportsPath, getAWSMeta, createTestMetaFile, getSampleRootPath } from '../src/utils';
import { addAuthWithDefault, signUpNewUser } from '../src/categories/auth';
import { copyAWSExportsToProj } from '../src/utils/projectMeta';
import { runCypressTest } from '../src/utils/runCypressTest';

describe('amplify storage UI test', () => {
    let projRoot: string;
    let destRoot: string;

    describe('Run test on JS app:', async () => {
        beforeAll(() => {
            projRoot = createNewProjectDir();
            destRoot = getSampleRootPath()
            jest.setTimeout(1000 * 60 * 60); // 1 hour
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
            expect(existsAWSExportsPath(projRoot)).toBeTruthy()
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

        //run UI test on react app
        it('should pass all UI tests on React app', async () => {
            copyAWSExportsToProj(projRoot, destRoot, 'react', 'auth/amplify-authenticator');
            await runCypressTest(destRoot, {platform: 'react', category: 'storage'}).then(isPassed => expect(isPassed).toBeTruthy())
          });



          // run UI test on angular app
          it.skip('should pass all UI tests on Angular app', async () => {
            copyAWSExportsToProj(projRoot, destRoot, 'angular', 'auth/amplify-authenticator')
            await runCypressTest(destRoot, {platform: 'angular', category: 'storage'}).then(isPassed => expect(isPassed).toBeTruthy())
          })


          // run UI test on vue app
          it.skip('should pass all UI tests on Vue app', async () => {
            copyAWSExportsToProj(projRoot, destRoot, 'vue', 'auth/amplify-authenticator')
            await runCypressTest(destRoot, {platform: 'vue', category: 'storage'}).then(isPassed => expect(isPassed).toBeTruthy())
          });
    });

})