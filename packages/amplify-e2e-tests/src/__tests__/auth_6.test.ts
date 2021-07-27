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

  it('...should init a javascript project and add auth with a all options and update front end config', async () => {
    await initJSProjectWithProfile(projRoot, defaultSettings);
    await addAuthWithMaxOptions(projRoot, {});
    await amplifyPushAuth(projRoot);

    const meta = getProjectMeta(projRoot);
    const authMeta: $TSAny = Object.values(meta.auth)[0];

    expect(authMeta.frontendAuthConfig).toMatchInlineSnapshot(`
      {
        "loginMechanism": [
          "EMAIL",
          "FACEBOOK",
          "GOOGLE",
          "AMAZON",
          "APPLE"
        ],
        "signupAttributes": [
          "EMAIL"
        ],
        "passwordProtectionSettings": {
          "passwordPolicyMinLength": 8,
          "passwordPolicyCharacters": [
            "REQUIRES_LOWERCASE",
            "REQUIRES_UPPERCASE",
            "REQUIRES_NUMBERS",
            "REQUIRES_SYMBOLS"
          ]
        },
        "mfaConfiguration": "ON",
        "mfaTypes": [
          "SMS",
          "TOTP"
        ]
      }
    `);
  });
});
