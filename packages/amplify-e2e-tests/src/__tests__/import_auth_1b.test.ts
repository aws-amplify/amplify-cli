import { stateManager } from '@aws-amplify/amplify-cli-core';
import {
  addApi,
  addAuthUserPoolOnlyWithOAuth,
  AddAuthUserPoolOnlyWithOAuthSettings,
  amplifyPush,
  amplifyPushAuth,
  amplifyStatus,
  createNewProjectDir,
  createUserPoolOnlyWithOAuthSettings,
  deleteProject,
  deleteProjectDir,
  getRootStackTemplate,
  initJSProjectWithProfile,
  updateApiSchema,
} from '@aws-amplify/amplify-e2e-core';
import {
  addS3WithAuthConfigurationMismatchErrorExit,
  AuthProjectDetails,
  expectAuthParametersMatch,
  expectLocalAndCloudMetaFilesMatching,
  getAuthProjectDetails,
  getOGAuthProjectDetails,
  getShortId,
  importUserPoolOnly,
} from '../import-helpers';

describe('auth import userpool only', () => {
  // eslint-disable-next-line spellcheck/spell-checker
  const projectPrefix = 'auimpup';
  // eslint-disable-next-line spellcheck/spell-checker
  const ogProjectPrefix = 'ogauimpup';

  const projectSettings = {
    name: projectPrefix,
  };

  const ogProjectSettings = {
    name: ogProjectPrefix,
  };

  const dummyOGProjectSettings = {
    // eslint-disable-next-line spellcheck/spell-checker
    name: 'dummyog1',
  };

  // OG is the CLI project that creates the user pool to import by other test projects
  let ogProjectRoot: string;
  let ogShortId: string;
  let ogSettings: AddAuthUserPoolOnlyWithOAuthSettings;
  let ogProjectDetails: AuthProjectDetails;

  // We need an extra OG project to make sure that autocomplete prompt hits in
  let dummyOGProjectRoot: string;
  let dummyOGSettings: AddAuthUserPoolOnlyWithOAuthSettings;

  let projectRoot: string;
  let ignoreProjectDeleteErrors = false;

  beforeAll(async () => {
    ogProjectRoot = await createNewProjectDir(ogProjectSettings.name);
    ogShortId = getShortId();
    ogSettings = createUserPoolOnlyWithOAuthSettings(ogProjectSettings.name, ogShortId);

    await initJSProjectWithProfile(ogProjectRoot, ogProjectSettings);
    await addAuthUserPoolOnlyWithOAuth(ogProjectRoot, ogSettings);
    await amplifyPushAuth(ogProjectRoot);

    ogProjectDetails = getOGAuthProjectDetails(ogProjectRoot);

    dummyOGProjectRoot = await createNewProjectDir(dummyOGProjectSettings.name);
    dummyOGSettings = createUserPoolOnlyWithOAuthSettings(dummyOGProjectSettings.name, ogShortId);

    await initJSProjectWithProfile(dummyOGProjectRoot, dummyOGProjectSettings);
    await addAuthUserPoolOnlyWithOAuth(dummyOGProjectRoot, dummyOGSettings);
    await amplifyPushAuth(dummyOGProjectRoot);
  });

  afterAll(async () => {
    await deleteProject(ogProjectRoot);
    deleteProjectDir(ogProjectRoot);

    await deleteProject(dummyOGProjectRoot);
    deleteProjectDir(dummyOGProjectRoot);
  });

  beforeEach(async () => {
    projectRoot = await createNewProjectDir(projectPrefix);
    ignoreProjectDeleteErrors = false;
  });

  afterEach(async () => {
    try {
      await deleteProject(projectRoot);
    } catch (error) {
      // In some tests where project initialization fails it can lead to errors on cleanup which we
      // can ignore if set by the test
      if (!ignoreProjectDeleteErrors) {
        throw error;
      }
    }

    deleteProjectDir(projectRoot);
  });

  it('imported userpool only auth, s3 storage add should fail with error', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await importUserPoolOnly(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' });

    // Imported auth resources cannot be used together with \'storage\' category\'s authenticated and unauthenticated access.
    await expect(addS3WithAuthConfigurationMismatchErrorExit(projectRoot)).rejects.toThrowError('Process exited with non zero exit code 1');
  });

  it('imported user pool only should allow iam auth in graphql api', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await importUserPoolOnly(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' });
    await addApi(
      projectRoot,
      {
        'Amazon Cognito User Pool': {},
        IAM: {},
        transformerVersion: 2,
      },
      false,
    );
    await updateApiSchema(projectRoot, projectPrefix, 'model_with_owner_and_iam_auth.graphql');
    await amplifyPush(projectRoot);

    const rootStackTemplate = getRootStackTemplate(projectRoot);
    const apiStackParams = rootStackTemplate?.Resources?.[`api${projectPrefix}`]?.Properties?.Parameters;
    expect(apiStackParams).toBeDefined();
    expect(apiStackParams.authRoleName).toEqual({
      Ref: 'AuthRoleName',
    });
    expect(apiStackParams.unauthRoleName).toEqual({
      Ref: 'UnauthRoleName',
    });
  });

  it('should update parameters.json with auth configuration', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await importUserPoolOnly(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' });

    const ogProjectAuthParameters = stateManager.getResourceParametersJson(ogProjectRoot, 'auth', ogProjectDetails.authResourceName);

    let projectDetails = getAuthProjectDetails(projectRoot);
    let projectAuthParameters = stateManager.getResourceParametersJson(projectRoot, 'auth', projectDetails.authResourceName);
    expectAuthParametersMatch(projectAuthParameters, ogProjectAuthParameters);

    await amplifyStatus(projectRoot, 'Import');
    await amplifyPushAuth(projectRoot);
    await amplifyStatus(projectRoot, 'No Change');

    expectLocalAndCloudMetaFilesMatching(projectRoot);

    projectDetails = getAuthProjectDetails(projectRoot);
    projectAuthParameters = stateManager.getResourceParametersJson(projectRoot, 'auth', projectDetails.authResourceName);
    expectAuthParametersMatch(projectAuthParameters, ogProjectAuthParameters);
  });
});
