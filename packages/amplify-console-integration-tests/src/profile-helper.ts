import { getProfileName } from './util';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as ini from 'ini';
import * as os from 'os';
import * as dotenv from 'dotenv';

const testRegionPool = ['ap-south-1', 'ap-northeast-1', 'ap-southeast-1', 'ap-northeast-2', 'ap-southeast-2'];

export function getConfigFromProfile() {
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

  const configKeyName = profileName === 'default' ? 'default' : `profile ${profileName}`;

  if (!credentials[profileName] || !config[configKeyName]) {
    setupAWSProfile();
    credentials = ini.parse(fs.readFileSync(credentialsFilePath, 'utf-8'));
    config = ini.parse(fs.readFileSync(configFilePath, 'utf-8'));
  }

  return {
    accessKeyId: credentials[profileName].aws_access_key_id,
    secretAccessKey: credentials[profileName].aws_secret_access_key,
    region: config[configKeyName].region,
  };
}

export function setupAWSProfile() {
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
      credentials[key].aws_access_key_id = process.env.CONSOLE_AWS_ACCESS_KEY_ID;
      credentials[key].aws_secret_access_key = process.env.CONSOLE_AWS_SECRET_ACCESS_KEY;
      isCredSet = true;
    }
  });
  if (!isCredSet) {
    credentials[profileName] = {
      aws_access_key_id: process.env.CONSOLE_AWS_ACCESS_KEY_ID,
      aws_secret_access_key: process.env.CONSOLE_AWS_SECRET_ACCESS_KEY,
    };
  }

  process.env.CONSOLE_REGION = process.env.CONSOLE_REGION || testRegionPool[Math.floor(Math.random() * testRegionPool.length)];
  let isConfigSet = false;
  Object.keys(config).forEach(key => {
    const keyName = key.replace('profile', '').trim();
    if (profileName === keyName) {
      config[key].region = process.env.CONSOLE_REGION;
      isConfigSet = true;
    }
  });
  if (!isConfigSet) {
    const keyName = profileName === 'default' ? 'default' : `profile ${profileName}`;
    config[keyName] = {
      region: process.env.CONSOLE_REGION,
    };
  }

  fs.writeFileSync(credentialsFilePath, ini.stringify(credentials));
  fs.writeFileSync(configFilePath, ini.stringify(config));
}
