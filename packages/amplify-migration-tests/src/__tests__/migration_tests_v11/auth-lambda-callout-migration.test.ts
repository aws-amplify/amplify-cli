import {
  addAuthWithMaxOptions,
  addAuthWithOidcForNonJSProject,
  amplifyPushAuth,
  amplifyPushForce,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  generateRandomShortId,
  getCloudFormationTemplate,
  updateAuthSignInSignOutUrl,
  updateHeadlessAuth,
} from '@aws-amplify/amplify-e2e-core';
import { UpdateAuthRequest } from 'amplify-headless-interface';
import { validateVersionsForMigrationTest } from '../../migration-helpers';
import { initIosProjectWithProfile11, initJSProjectWithProfileV11 } from '../../migration-helpers-v11/init';

const defaultsSettings = {
  name: 'authTest',
  disableAmplifyAppCreation: false,
};

describe('lambda callouts', () => {
  let projRoot: string;
  const projectName: string = 'lambdaRemove';

  beforeAll(async () => {
    await validateVersionsForMigrationTest();
  });

  beforeEach(async () => {
    projRoot = await createNewProjectDir(projectName);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  const expectNoLambdasInCfnTemplate = async (template: Record<string, any>) => {
    expect(template?.Resources).toBeDefined();
    expect(Object.values(template?.Resources).filter((r: Record<string, any>) => r?.type?.includes('Lambda')).length).toBe(0);
  };

  it('should be migrated after force pushing auth with max settings', async () => {
    await initJSProjectWithProfileV11(projRoot, defaultsSettings);
    const resourceName = `test${generateRandomShortId()}`;
    await addAuthWithMaxOptions(projRoot, { name: resourceName });

    // force push with latest should regenerate auth stack and remove lambda callouts
    await amplifyPushForce(projRoot, true);

    // validate Lambda resources do not exist in template and cloud
    const template = await getCloudFormationTemplate(projRoot, 'auth', resourceName);
    expectNoLambdasInCfnTemplate(template);
  });

  it('should be migrated after updating auth with OIDC', async () => {
    await initIosProjectWithProfile11(projRoot, defaultsSettings);
    const resourceName = `test${generateRandomShortId()}`;
    await addAuthWithOidcForNonJSProject(projRoot, { resourceName, frontend: 'ios' });
    await amplifyPushAuth(projRoot, false);

    await updateAuthSignInSignOutUrl(projRoot, {
      skipThree: true,
      signinUrl: 'https://www.google.com/',
      signoutUrl: 'https://www.nytimes.com/',
      updatesigninUrl: 'https://www.amazon.com/',
      updatesignoutUrl: 'https://www.amazon.com/',
      testingWithLatestCodebase: true,
    });
    await amplifyPushAuth(projRoot, true);

    // validate Lambda resources do not exist in template and cloud
    const template = await getCloudFormationTemplate(projRoot, 'auth', resourceName);
    expectNoLambdasInCfnTemplate(template);
  });

  it('should be migrated when set up using headless commands', async () => {
    await initJSProjectWithProfileV11(projRoot, defaultsSettings);
    const resourceName = `test${generateRandomShortId()}`;
    await addAuthWithMaxOptions(projRoot, { name: resourceName });
    await amplifyPushAuth(projRoot, false);

    const updateAuthRequest: UpdateAuthRequest = {
      version: 2,
      serviceModification: {
        serviceName: 'Cognito',
        userPoolModification: {
          userPoolGroups: [
            {
              groupName: 'group1',
            },
            {
              groupName: 'group2',
            },
          ],
        },
        includeIdentityPool: true,
        identityPoolModification: {
          identitySocialFederation: [{ provider: 'GOOGLE', clientId: 'fakeClientId' }],
        },
      },
    };

    await updateHeadlessAuth(projRoot, updateAuthRequest, { testingWithLatestCodebase: true });
    await amplifyPushAuth(projRoot, true);

    // validate Lambda resources do not exist in template and cloud
    const template = await getCloudFormationTemplate(projRoot, 'auth', resourceName);
    expectNoLambdasInCfnTemplate(template);
  });
});
