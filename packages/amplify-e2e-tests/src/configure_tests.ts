import { config } from 'dotenv';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

import configure from './configure';
import { isCI } from './utils'

const AWS_CREDENTIAL_PATH = join(homedir(), '.aws', 'credentials');

async function setUpAmplify() {
  if (existsSync(AWS_CREDENTIAL_PATH)) { // AWS isn't configured
    let AWS_ACCESS_KEY_ID;
    let AWS_SECRET_ACCESS_KEY;
    if (!isCI()) {
      // Local testing. Use .env file to get the AWS credentials
      const result = config();
      AWS_ACCESS_KEY_ID = result.parsed.AWS_ACCESS_KEY_ID;
      AWS_SECRET_ACCESS_KEY = result.parsed.AWS_SECRET_ACCESS_KEY;
    } else {
      AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
      AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
    }
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error('Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env or as Environment variable in CircleCI');
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
  try {
    await setUpAmplify();
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
});
