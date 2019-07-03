import {
  initProjectWithProfile,
  deleteProject,
  amplifyPushApi
} from '../src/init';
import { addApiWithSimpleModel, readSchemaDocument } from '../src/categories/api';
import { createNewProjectDir, deleteProjectDir,
  getSampleRootPath, existsAWSExportsPath,
  getAWSMeta, createTestMetaFile } from '../src/utils';
import { addAuthWithDefault, signUpNewUser } from '../src/categories/auth';
import { copyAWSExportsToProj } from '../src/utils/projectMeta';
import { runCypressTest } from '../src/utils/runCypressTest';

describe('amplify API UI test', () => {
  let projRoot: string;
  let destRoot: string;

  describe('Run test on JS app:', async () => {
    beforeAll(() => {
      projRoot = createNewProjectDir();
      destRoot = getSampleRootPath();
      jest.setTimeout(1000 * 60 * 60); // 1 hour
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
      await runCypressTest(destRoot, {platform: 'react', category: 'api'}).then(isPassed => expect(isPassed).toBeTruthy())
    });
  });
});
