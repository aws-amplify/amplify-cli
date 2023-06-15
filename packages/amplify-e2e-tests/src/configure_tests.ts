import { amplifyConfigure as configure, injectSessionToken, isCI } from '@aws-amplify/amplify-e2e-core';

export type AmplifySetupOptions = {
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  REGION?: string;
  AWS_SESSION_TOKEN?: string;
};
export async function setupAmplify({
  AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY,
  REGION = process.env.CLI_REGION,
  AWS_SESSION_TOKEN = process.env.AWS_SESSION_TOKEN,
}: AmplifySetupOptions = {}) {
  if (isCI()) {
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !REGION) {
      throw new Error('Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and CLI_REGION in .env');
    }
    await configure({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      profileName: 'amplify-integ-test-user',
      region: REGION,
    });
    if (AWS_SESSION_TOKEN) {
      injectSessionToken('amplify-integ-test-user');
    }
  } else {
    console.log('AWS Profile is already configured');
  }
}

process.nextTick(async () => {
  try {
    await setupAmplify();
  } catch (e) {
    console.log(e.stack);
    process.exit(1);
  }
  process.exit();
});
