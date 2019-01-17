const aws = require('aws-sdk');
const fs = require('fs-extra');
const path = require('path');
const ini = require('ini');
const os = require('os');

const dotAWSDirPath = path.normalize(path.join(os.homedir(), '.aws'));
const credentialsFilePath = path.join(dotAWSDirPath, 'credentials');
const configFilePath = path.join(dotAWSDirPath, 'config');

function setProfile(awsConfig, profileName) {
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
  Object.keys(credentials).forEach((key) => {
    const keyName = key.trim();
    if (profileName === keyName) {
      credentials[key].aws_access_key_id = awsConfig.accessKeyId;
      credentials[key].aws_secret_access_key = awsConfig.secretAccessKey;
      isCredSet = true;
    }
  });
  if (!isCredSet) {
    credentials[profileName] = {
      aws_access_key_id: awsConfig.accessKeyId,
      aws_secret_access_key: awsConfig.secretAccessKey,
    };
  }

  let isConfigSet = false;
  Object.keys(config).forEach((key) => {
    const keyName = key.replace('profile', '').trim();
    if (profileName === keyName) {
      config[key].region = awsConfig.region;
      isConfigSet = true;
    }
  });
  if (!isConfigSet) {
    const keyName = (profileName === 'default') ? 'default' : `profile ${profileName}`;
    config[keyName] = {
      region: awsConfig.region,
    };
  }

  fs.writeFileSync(credentialsFilePath, ini.stringify(credentials));
  fs.writeFileSync(configFilePath, ini.stringify(config));
}

async function getProfiledAwsConfig(profileName, isRoleSourceProfile) {
  let awsConfig;
  const profileConfig = getProfileConfig(profileName);
  if (profileConfig) {
    if (!isRoleSourceProfile && profileConfig.role_arn && profileConfig.source_profile) {
      const roleCredentials =
        await getRoleCredentials(profileConfig);
      delete profileConfig.role_arn;
      delete profileConfig.source_profile;
      awsConfig = {
        ...profileConfig,
        ...roleCredentials,
      };
    } else {
      const profileCredentials = getProfileCredentials(profileName);
      awsConfig = {
        ...profileConfig,
        ...profileCredentials,
      };
    }
  } else {
    throw new Error(`Profile configuration is missing for: ${profileName}`);
  }

  return awsConfig;
}

async function getRoleCredentials(profileConfig) {
  const sourceProfileAwsConfig =
    await getProfiledAwsConfig(profileConfig.source_profile, true);
  aws.config.update(sourceProfileAwsConfig);
  const sts = new aws.STS();
  const roleData = await sts.assumeRole({
    RoleArn: profileConfig.role_arn,
    RoleSessionName: 'amplify',
    ExternalId: profileConfig.external_id,
  }).promise();

  return {
    accessKeyId: roleData.Credentials.AccessKeyId,
    secretAccessKey: roleData.Credentials.SecretAccessKey,
    sessionToken: roleData.Credentials.SessionToken,
  };
}

function getProfileConfig(profileName) {
  let profileConfig;
  if (fs.existsSync(configFilePath)) {
    const config = ini.parse(fs.readFileSync(configFilePath, 'utf-8'));
    Object.keys(config).forEach((key) => {
      const keyName = key.replace('profile', '').trim();
      if (profileName === keyName) {
        profileConfig = config[key];
      }
    });
  }
  return normalizeKeys(profileConfig);
}

function getProfileCredentials(profileName) {
  let profileCredentials;
  if (fs.existsSync(credentialsFilePath)) {
    const credentials = ini.parse(fs.readFileSync(credentialsFilePath, 'utf-8'));

    Object.keys(credentials).forEach((key) => {
      const keyName = key.trim();
      if (profileName === keyName) {
        profileCredentials = credentials[key];
      }
    });
  }
  return normalizeKeys(profileCredentials);
}

function normalizeKeys(config) {
  if (config) {
    config.accessKeyId = config.accessKeyId || config.aws_access_key_id;
    config.secretAccessKey = config.secretAccessKey || config.aws_secret_access_key;
    config.sessionToken = config.sessionToken || config.aws_session_token;
    delete config.aws_access_key_id;
    delete config.aws_secret_access_key;
    delete config.aws_session_token;
  }
  return config;
}

function getProfileRegion(profileName) {
  let profileRegion;

  const profileConfig = getProfileConfig(profileName);
  if (profileConfig) {
    profileRegion = profileConfig.region;
  }

  return profileRegion;
}

function getNamedProfiles() {
  let namedProfiles;
  if (fs.existsSync(configFilePath)) {
    const config = ini.parse(fs.readFileSync(configFilePath, 'utf-8'));
    namedProfiles = {};
    Object.keys(config).forEach((key) => {
      const profileName = key.replace('profile', '').trim();
      if (!namedProfiles[profileName]) {
        namedProfiles[profileName] = config[key];
      }
    });
  }
  return namedProfiles;
}

module.exports = {
  setProfile,
  getProfiledAwsConfig,
  getProfileRegion,
  getNamedProfiles,
};
