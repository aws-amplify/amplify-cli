import { config } from 'dotenv';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

import configure from './configure';

const AWS_CREDENTIAL_PATH = join(homedir(), '.aws', 'credentials');

async function setUpAmplify() {
  if (!existsSync(AWS_CREDENTIAL_PATH)) {
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = config().parsed;
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error('Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
    }
    await configure({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      profileName: 'amplify-integ-test'
    });
  } else {
    console.log('AWS Profile is already configured');
  }
}

process.nextTick(async () => {
  await setUpAmplify();
});
