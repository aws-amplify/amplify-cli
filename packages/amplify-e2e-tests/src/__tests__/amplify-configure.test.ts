import {
  amplifyConfigure,
  nspawn as spawn,
  getCLIPath,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';

describe('amplify configure', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('amplify-configure');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('validates key inputs', async () => {
    await testAmplifyConfigureValidation();
  });

  it('should turn on/off Usage Data', async () => {
    await amplifyConfigure(projRoot, 'usage-data-on');
    await amplifyConfigure(projRoot, 'usage-data-off');
  });

  it('should turn on/off share-project-config', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await amplifyConfigure(projRoot, 'share-project-config-off');
    await amplifyConfigure(projRoot, 'share-project-config-on');
  });
});

function testAmplifyConfigureValidation(): Promise<void> {
  const validMockAWSAccessKeyId = 'AKIAIOSFODNN7EXAMPLE';
  const defaultAWSAccessKeyId = '<YOUR_ACCESS_KEY_ID>';
  const accessKeyIdWithSpace = 'MOCK_JKLN 6VBMOLVRGX';
  const accessKeyIdTooShort = 'MOCK_JKLN'; //less than 16
  let accessKeyIdTooLong = 'MOCK'; //more than 128
  for (let i = 0; i < 6; i++) {
    accessKeyIdTooLong += accessKeyIdTooLong;
  }

  const validMockAWSSecretAccessKey = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
  const defaultAWSSecretAccessKey = '<YOUR_SECRET_ACCESS_KEY>';

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['configure'], { stripColors: true })
      .wait('Sign in to your AWS administrator account:')
      .wait('Press Enter to continue')
      .sendCarriageReturn()
      .wait('Specify the AWS Region')
      .sendCarriageReturn()
      .wait('Press Enter to continue')
      .sendCarriageReturn()
      .wait('accessKeyId')
      .sendLine(accessKeyIdWithSpace)
      .wait('You must enter a valid accessKeyId')
      .sendLine(accessKeyIdTooShort)
      .wait('You must enter a valid accessKeyId')
      .sendLine(accessKeyIdTooLong)
      .wait('You must enter a valid accessKeyId')
      .sendLine(defaultAWSAccessKeyId)
      .wait('You must enter a valid accessKeyId')
      .sendLine(validMockAWSAccessKeyId)
      .wait('secretAccessKey')
      .sendLine(defaultAWSSecretAccessKey)
      .wait('You must enter a valid secretAccessKey')
      .sendLine(validMockAWSSecretAccessKey)
      .wait('Profile Name:')
      // Fake credentials used in this test are always invalid therefore
      // 'config-test' is a new profile name using defaultAWSSecretAccessKey and validMockAWSSecretAccessKey
      // to avoid overwriting profiles used in other tests.
      // Do NOT use TEST_PROFILE_NAME here, otherwise, it will override the default profile.
      .sendLine('config-test')
      .wait('Successfully set up the new user.')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
