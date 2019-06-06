const aws = require('aws-sdk');
const fs = require('fs-extra');
const path = require('path');
const ini = require('ini');
const os = require('os');
const inquirer = require('inquirer');
const constants = require('./constants');
const proxyAgent = require('proxy-agent');


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
    const keyName = profileName === 'default' ? 'default' : `profile ${profileName}`;
    config[keyName] = {
      region: awsConfig.region,
    };
  }

  fs.writeFileSync(credentialsFilePath, ini.stringify(credentials));
  fs.writeFileSync(configFilePath, ini.stringify(config));
}

async function getProfiledAwsConfig(context, profileName, isRoleSourceProfile) {
  let awsConfig;
  const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
  const profileConfig = getProfileConfig(profileName);
  if (profileConfig) {
    if (!isRoleSourceProfile && profileConfig.role_arn) {
      const roleCredentials = await getRoleCredentials(context, profileName, profileConfig);
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

  if (httpProxy) {
    awsConfig = {
      ...awsConfig,
      httpOptions: { agent: proxyAgent(httpProxy) },
    };
  }

  return awsConfig;
}

async function getRoleCredentials(context, profileName, profileConfig) {
  const roleSessionName = profileConfig.role_session_name || 'amplify';
  let roleCredentials = getCachedRoleCredentials(context, profileConfig.role_arn, roleSessionName);

  if (!roleCredentials) {
    const sourceProfileAwsConfig = profileConfig.source_profile
      ? await getProfiledAwsConfig(context, profileConfig.source_profile, true)
      : {};
    let mfaTokenCode;
    if (profileConfig.mfa_serial) {
      context.print.info(`Profile ${profileName} is configured to assume role`);
      context.print.info(`  ${profileConfig.role_arn}`);
      context.print.info('It requires MFA authentication. The MFA device is');
      context.print.info(`  ${profileConfig.mfa_serial}`);
      mfaTokenCode = await getMfaTokenCode();
    }

    const sts = new aws.STS(sourceProfileAwsConfig);
    const roleData = await sts
      .assumeRole({
        RoleArn: profileConfig.role_arn,
        RoleSessionName: roleSessionName,
        DurationSeconds: profileConfig.duration_seconds,
        ExternalId: profileConfig.external_id,
        SerialNumber: profileConfig.mfa_serial,
        TokenCode: mfaTokenCode,
      })
      .promise();

    roleCredentials = {
      accessKeyId: roleData.Credentials.AccessKeyId,
      secretAccessKey: roleData.Credentials.SecretAccessKey,
      sessionToken: roleData.Credentials.SessionToken,
      expiration: roleData.Credentials.Expiration,
    };

    cacheRoleCredentials(context, profileConfig.role_arn, roleSessionName, roleCredentials);
  }

  return roleCredentials;
}

async function getMfaTokenCode() {
  const inputMfaTokenCode = {
    type: 'input',
    name: 'tokenCode',
    message: 'Enter the MFA token code:',
    validate: (value) => {
      let isValid = value.length === 6;
      if (!isValid) {
        return 'Must have length equal to 6';
      }
      isValid = /^[\d]*$/.test(value);
      if (!isValid) {
        return 'Must only contain digits, e.g., must satisfy regular expression pattern: [\\d]*';
      }
      return true;
    },
  };
  const answer = await inquirer.prompt(inputMfaTokenCode);
  return answer.tokenCode;
}

function cacheRoleCredentials(context, roleArn, sessionName, credentials) {
  let cacheContents = {};
  const cacheFilePath = getCacheFilePath(context);
  if (fs.existsSync(cacheFilePath)) {
    cacheContents = context.amplify.readJsonFile(cacheFilePath, 'utf-8');
  }
  cacheContents[roleArn] = cacheContents[roleArn] || {};
  cacheContents[roleArn][sessionName] = credentials;
  const jsonString = JSON.stringify(cacheContents, null, 4);
  fs.writeFileSync(cacheFilePath, jsonString, 'utf8');
}

function getCachedRoleCredentials(context, roleArn, sessionName) {
  let roleCredentials;
  const cacheFilePath = getCacheFilePath(context);
  if (fs.existsSync(cacheFilePath)) {
    const cacheContents = context.amplify.readJsonFile(cacheFilePath, 'utf-8');
    if (cacheContents[roleArn]) {
      roleCredentials = cacheContents[roleArn][sessionName];
      roleCredentials = validateCachedCredentials(roleCredentials) ? roleCredentials : undefined;
    }
  }
  return roleCredentials;
}

function validateCachedCredentials(roleCredentials) {
  let isValid = false;

  if (roleCredentials) {
    isValid =
      !isCredentialsExpired(roleCredentials) &&
      roleCredentials.accessKeyId &&
      roleCredentials.secretAccessKey &&
      roleCredentials.sessionToken;
  }

  return isValid;
}

function isCredentialsExpired(roleCredentials) {
  let isExpired = true;

  if (roleCredentials && roleCredentials.expiration) {
    const TOTAL_MILLISECONDS_IN_ONE_MINUTE = 1000 * 60;
    const now = new Date();
    const expirationDate = new Date(roleCredentials.expiration);
    isExpired = expirationDate - now < TOTAL_MILLISECONDS_IN_ONE_MINUTE;
  }

  return isExpired;
}

async function resetCache(context, profileName) {
  let awsConfig;
  const profileConfig = getProfileConfig(profileName);
  const cacheFilePath = getCacheFilePath(context);
  if (profileConfig && profileConfig.role_arn && fs.existsSync(cacheFilePath)) {
    const cacheContents = context.amplify.readJsonFile(cacheFilePath, 'utf-8');
    if (cacheContents[profileConfig.role_arn]) {
      delete cacheContents[profileConfig.role_arn];
      const jsonString = JSON.stringify(cacheContents, null, 4);
      fs.writeFileSync(cacheFilePath, jsonString, 'utf8');
      context.print.success('  Cached temp credentials are deleted for the project.');
      context.print.info('');
    } else {
      context.print.info('  No temp credentials are cached for the project.');
      context.print.info('');
    }
  } else {
    context.print.info('  No temp credentials are cached for the project.');
    context.print.info('');
  }
  return awsConfig;
}

function getCacheFilePath(context) {
  const sharedConfigDirPath = path.join(
    context.amplify.pathManager.getHomeDotAmplifyDirPath(),
    constants.Label,
  );
  fs.ensureDirSync(sharedConfigDirPath);
  return path.join(sharedConfigDirPath, constants.CacheFileName);
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
  resetCache,
};
