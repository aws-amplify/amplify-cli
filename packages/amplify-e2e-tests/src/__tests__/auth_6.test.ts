import { $TSAny } from 'amplify-cli-core';
import {
  addAuthWithDefault,
  addAuthWithMaxOptions,
  amplifyOverrideAuth,
  amplifyPushAuth,
  amplifyPushOverride,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  getUserPool,
  initJSProjectWithProfile,
  runAmplifyAuthConsole,
} from 'amplify-e2e-core';
import * as path from 'path';
import * as fs from 'fs-extra';

const PROJECT_NAME = 'authTest';
const defaultSettings = {
  name: PROJECT_NAME,
};
describe('zero config auth', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('zero-config-auth');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should init a javascript project and add auth with all options and update front end config', async () => {
    await initJSProjectWithProfile(projRoot, defaultSettings);
    await addAuthWithMaxOptions(projRoot, {});
    await amplifyPushAuth(projRoot);

    const meta = getProjectMeta(projRoot);
    const authMeta: $TSAny = Object.values(meta.auth)[1];

    expect(authMeta.frontendAuthConfig).toMatchInlineSnapshot(`
      Object {
        "mfaConfiguration": "ON",
        "mfaTypes": Array [
          "SMS",
          "TOTP",
        ],
        "passwordProtectionSettings": Object {
          "passwordPolicyCharacters": Array [
            "REQUIRES_LOWERCASE",
            "REQUIRES_UPPERCASE",
            "REQUIRES_NUMBERS",
            "REQUIRES_SYMBOLS",
          ],
          "passwordPolicyMinLength": 8,
        },
        "signupAttributes": Array [
          "EMAIL",
        ],
        "socialProviders": Array [
          "FACEBOOK",
          "GOOGLE",
          "AMAZON",
          "APPLE",
        ],
        "usernameAttributes": Array [],
        "verificationMechanisms": Array [
          "EMAIL",
        ],
      }
    `);
  });

  it('...should init a project and add auth with defaults with overrides', async () => {
    await initJSProjectWithProfile(projRoot, defaultSettings);
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);
    await runAmplifyAuthConsole(projRoot);
    const meta = getProjectMeta(projRoot);
    const authResourceName = Object.keys(meta.auth).filter(key => meta.auth[key].service === 'Cognito');
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();

    // override new env
    await amplifyOverrideAuth(projRoot, {});
    const srcOverrideFilePath = path.join(__dirname, '..', '..', 'overrides', 'override-auth.ts');
    const destOverrideFilePath = path.join(projRoot, 'amplify', 'backend', 'auth', `${authResourceName}`, 'override.ts');
    fs.copyFileSync(srcOverrideFilePath, destOverrideFilePath);
    await amplifyPushOverride(projRoot);
    // check overidden config
    const overridenUserPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    expect(overridenUserPool.UserPool).toBeDefined();
    expect(overridenUserPool.UserPool.DeviceConfiguration.ChallengeRequiredOnNewDevice).toBe(true);
  });
});
