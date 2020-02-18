import { getProfileName } from './util';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as ini from 'ini';
import * as os from 'os';
import * as dotenv from 'dotenv';

function setupAWSProfile() {
  dotenv.config();

  const dotAWSDirPath = path.normalize(path.join(os.homedir(), '.aws'));
  const credentialsFilePath = path.join(dotAWSDirPath, 'credentials');
  const configFilePath = path.join(dotAWSDirPath, 'config');
  const profileName = getProfileName();

  fs.ensureDirSync(dotAWSDirPath);

  let credentials = {};
  let config = {};
  if (fs.existsSync(credentialsFilePath)) {
    credentials = ini.parse(fs.readFileSync(credentialsFilePath, 'utf-8'));
  }
  if (fs.existsSync(configFilePath)) {
    config = ini.parse(fs.readFileSync(configFilePath, 'utf-8'));
  }

  let isCredSet = false;
  Object.keys(credentials).forEach(key => {
    const keyName = key.trim();
    if (profileName === keyName) {
      credentials[key].aws_access_key_id = process.env.AWS_ACCESS_KEY_ID;
      credentials[key].aws_secret_access_key = process.env.AWS_SECRET_ACCESS_KEY;
      isCredSet = true;
    }
  });
  if (!isCredSet) {
    credentials[profileName] = {
      aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
      aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  let isConfigSet = false;
  Object.keys(config).forEach(key => {
    const keyName = key.replace('profile', '').trim();
    if (profileName === keyName) {
      config[key].region = process.env.CLI_REGION;
      isConfigSet = true;
    }
  });
  if (!isConfigSet) {
    const keyName = profileName === 'default' ? 'default' : `profile ${profileName}`;
    config[keyName] = {
      region: process.env.CLI_REGION,
    };
  }

  fs.writeFileSync(credentialsFilePath, ini.stringify(credentials));
  fs.writeFileSync(configFilePath, ini.stringify(config));
}

process.nextTick(() => {
  try {
    setupAWSProfile();
  } catch (e) {
    console.log(e.stack);
    process.exit(1);
  }
});
