import { amplifyConfigure as configure, injectSessionToken, isCI } from '@aws-amplify/amplify-e2e-core';

async function setupAmplify() {
  if (isCI()) {
    const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
    const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
    const REGION = process.env.CLI_REGION;
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !REGION) {
      throw new Error('Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and CLI_REGION in .env');
    }
    await configure(null, {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      profileName: 'amplify-integ-test-user',
      region: REGION,
    });
    if (process.env.AWS_SESSION_TOKEN) {
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
