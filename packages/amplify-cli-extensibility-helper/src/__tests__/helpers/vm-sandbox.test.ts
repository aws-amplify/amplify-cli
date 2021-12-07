import * as mocked from '../../helpers/project-info';
import { getVmSandbox } from '../../helpers/vm-sandbox';

describe('vm-sandbox', () => {
  const realProcessEnv: NodeJS.ProcessEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...realProcessEnv };
    jest.spyOn(mocked, 'getProjectInfo').mockImplementation(() => {
      return {
        envName: 'mockEnvironment',
        projectName: 'mockProject',
      };
    });
  });

  afterAll(() => {
    process.env = { ...realProcessEnv };
  });

  for (const testEnv of [
    'TEST_SECRET_TEST',
    'TEST_SECRET',
    'SECRET_TEST',
    'AMPLIFY_AMAZON_CLIENT_SECRET',
    'AMPLIFY_FACEBOOK_CLIENT_SECRET',
    'AMPLIFY_GOOGLE_CLIENT_SECRET',
  ]) {
    it(`returns filtered environment given key ${ testEnv }`, () => {
      process.env[testEnv] = testEnv;
      const sandbox = getVmSandbox();
      expect(sandbox.amplify.env[testEnv]).toBeUndefined();
    });
  }

  const amplifyDefinedEnvironmentVariables: string[] = [
    // excludes variables containing 'SECRET'
    '_BUILD_TIMEOUT',
    '_LIVE_UPDATES',
    'AMPLIFY_AMAZON_CLIENT_ID',
    'AMPLIFY_BACKEND_APP_ID',
    'AMPLIFY_BACKEND_PULL_ONLY',
    'AMPLIFY_DIFF_BACKEND',
    'AMPLIFY_DIFF_DEPLOY',
    'AMPLIFY_DIFF_DEPLOY_ROOT',
    'AMPLIFY_FACEBOOK_CLIENT_ID',
    'AMPLIFY_GOOGLE_CLIENT_ID',
    'AMPLIFY_IDENTITYPOOL_ID',
    'AMPLIFY_MONOREPO_APP_ROOT',
    'AMPLIFY_NATIVECLIENT_ID',
    'AMPLIFY_SKIP_BACKEND_BUILD',
    'AMPLIFY_USERPOOL_ID',
    'AMPLIFY_WEBCLIENT_ID',
    'AWS_APP_ID',
    'AWS_BRANCH',
    'AWS_BRANCH_ARN',
    'AWS_CLONE_URL',
    'AWS_COMMIT_ID',
    'AWS_JOB_ID',
  ];
  for (const testEnv of amplifyDefinedEnvironmentVariables) {
    it(`returns environment given amplify defined key ${ testEnv }`, () => {
      const expected = `value_${ testEnv }`;
      process.env[testEnv] = expected;
      const sandbox = getVmSandbox();
      expect(sandbox.amplify.env[testEnv]).toStrictEqual(expected);
    });
  }
});
