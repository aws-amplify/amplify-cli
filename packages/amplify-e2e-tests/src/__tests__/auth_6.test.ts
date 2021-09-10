import { $TSAny } from 'amplify-cli-core';
import {
  addAuthWithMaxOptions,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
} from 'amplify-e2e-core';

const PROJECT_NAME = 'authTest';
const defaultSettings = {
  name: PROJECT_NAME,
};
describe('zero config auth ', () => {
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
        "loginMechanisms": Array [
          "EMAIL",
          "FACEBOOK",
          "GOOGLE",
          "AMAZON",
          "APPLE",
        ],
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
        "verificationMechanisms": Array [
          "EMAIL",
        ],
      }
    `);
  });
});
