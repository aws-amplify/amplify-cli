import {
  initProjectWithProfile,
  deleteProject,
  amplifyPushApi
} from '../../src/init';
import { addApiWithSimpleModel, readSchemaDocument } from '../../src/categories/api';
import { createNewProjectDir, deleteProjectDir, createTestMetaFile } from '../../src/utils';
import { addAuthWithDefault, signUpNewUser } from '../../src/categories/auth';
import { copyAWSExportsToProj, existsAWSExportsPath } from '../../src/utils/projectMeta';
import { runCypressTest, gitCloneSampleApp, buildApp, startServer, closeServer } from '../../src/utils/command';

describe('Javascript SDK', () => {
  let projRoot: string;
  let destRoot: string;
  const API_PORT_NUMBER: string = '3003';
  const JS_SAMPLE_APP_REPO: string = 'https://github.com/AaronZyLee/photo-albums.git';

  describe('Simple API UI test:', async () => {
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
      await initProjectWithProfile(projRoot, {name: 'simplemodel'});
      readSchemaDocument('simple_model');
      await addAuthWithDefault(projRoot, {});
      await addApiWithSimpleModel(projRoot, {});
      await amplifyPushApi(projRoot);
      expect(existsAWSExportsPath(projRoot, 'js')).toBeTruthy();
    });

    it('should have user pool in backend and sign up a user for test', async () => {
      const settings = await signUpNewUser(projRoot);
      await createTestMetaFile(destRoot, {...settings, port: API_PORT_NUMBER, category: "api"});
  })

    describe('Run UI tests on JS app', async () => {
      afterEach(async () => {
        await closeServer(destRoot, {port: API_PORT_NUMBER});
      });

      it('should pass all UI tests on React app', async () => {
        copyAWSExportsToProj(projRoot, destRoot, 'react', 'auth/amplify-authenticator');
        await buildApp(destRoot, {});
        await startServer(destRoot, {category: 'api'});
        await runCypressTest(destRoot, {platform: 'react', category: 'api'}).then(isPassed => expect(isPassed).toBeTruthy());
      });

      it('should pass all UI tests on Angular app', () => {
        //TODO: add angular tests
      })


      it('should pass all UI tests on Vue app', () => {
        //TODO: add vue tests
      });
    });

  });
});
