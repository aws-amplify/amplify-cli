import configure from './configure';
import { isCI } from './utils';

async function setUpAmplify() {
  if (isCI()) {
    let AWS_ACCESS_KEY_ID;
    let AWS_SECRET_ACCESS_KEY;
    AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
    AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error(
        'Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env'
      );
    }
    await configure({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      profileName: 'amplify-integ-test-user'
    });
  } else {
    console.log('AWS Profile is already configured');
  }
}

process.nextTick(async () => {
  try {
    await setUpAmplify();
  } catch (e) {
    console.log(e.stack);
    process.exit(1);
  }
});
