import {
  addAuthWithRecaptchaTrigger,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getCLIPath,
  getProjectMeta,
  getUserPool,
  initJSProjectWithProfile,
  nspawn as spawn,
} from '@aws-amplify/amplify-e2e-core';
import { DescribeUserPoolCommandOutput } from '@aws-sdk/client-cognito-identity-provider';

const defaultsSettings = {
  name: 'authTest',
};

describe('amplify auth with trigger', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add auth with trigger, push, update auth, push, verify trigger attachment', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithRecaptchaTrigger(projRoot);
    await amplifyPushAuth(projRoot);

    const meta = getProjectMeta(projRoot);
    const userPoolId = Object.keys(meta.auth).map((key) => meta.auth[key])[0].output.UserPoolId;
    let userPool = (await getUserPool(userPoolId, meta.providers.awscloudformation.Region)) as DescribeUserPoolCommandOutput;

    expect(userPool.UserPool).toBeDefined();
    expect(userPool.UserPool.LambdaConfig).toBeDefined();
    expect(userPool.UserPool.LambdaConfig.CreateAuthChallenge).toBeDefined();
    expect(userPool.UserPool.LambdaConfig.DefineAuthChallenge).toBeDefined();
    expect(userPool.UserPool.LambdaConfig.VerifyAuthChallengeResponse).toBeDefined();

    await updateAuthChangeToUserPoolOnlyAndSetCodeMessages(projRoot);

    await amplifyPushAuth(projRoot);

    userPool = (await getUserPool(userPoolId, meta.providers.awscloudformation.Region)) as DescribeUserPoolCommandOutput;

    expect(userPool.UserPool).toBeDefined();
    expect(userPool.UserPool.EmailVerificationSubject).toBe('New code');
    expect(userPool.UserPool.EmailVerificationMessage).toBe('New code is {####}');
    expect(userPool.UserPool.LambdaConfig).toBeDefined();
    expect(userPool.UserPool.LambdaConfig.CreateAuthChallenge).toBeDefined();
    expect(userPool.UserPool.LambdaConfig.DefineAuthChallenge).toBeDefined();
    expect(userPool.UserPool.LambdaConfig.VerifyAuthChallengeResponse).toBeDefined();
  });

  const updateAuthChangeToUserPoolOnlyAndSetCodeMessages = async (cwd: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const chain = spawn(getCLIPath(), ['update', 'auth'], { cwd, stripColors: true });

      chain
        .wait('What do you want to do')
        .sendKeyDown()
        .sendCarriageReturn()
        .wait('Select the authentication/authorization services that you want to use')
        .sendKeyDown()
        .sendCarriageReturn()
        .wait('Do you want to add User Pool Groups')
        .sendKeyDown()
        .sendCarriageReturn() // No
        .wait('Do you want to add an admin queries API')
        .sendKeyDown()
        .sendCarriageReturn() // No
        .wait('Multifactor authentication (MFA) user login options')
        .sendCarriageReturn() // Select Off
        .wait('Email based user registration/forgot password')
        .sendCarriageReturn() // Enabled
        .wait('Specify an email verification subject')
        .sendLine('New code') // New code
        .wait('Specify an email verification message')
        .sendLine('New code is {####}') // New code is {####}
        .wait('Do you want to override the default password policy')
        .sendConfirmNo()
        .wait("Specify the app's refresh token expiration period")
        .sendCarriageReturn() // 30
        .wait('Do you want to specify the user attributes this app can read and write')
        .sendConfirmNo()
        .wait('Do you want to enable any of the following capabilities')
        .sendCarriageReturn() // Preserve recaptcha trigger
        .wait('Do you want to use an OAuth flow')
        .sendKeyDown()
        .sendCarriageReturn() // No
        .wait('Do you want to configure Lambda Triggers for Cognito')
        .sendConfirmNo()
        .sendEof()
        .run((err: Error) => (err ? reject(err) : resolve()));
    });
  };
});
