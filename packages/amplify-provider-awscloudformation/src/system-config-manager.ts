import { $TSAny, $TSContext, JSONUtilities, pathManager, SecretFileMode } from 'amplify-cli-core';

const aws = require('aws-sdk');
const fs = require('fs-extra');
const path = require('path');
const ini = require('ini');
const inquirer = require('inquirer');
const constants = require('./constants');
const proxyAgent = require('proxy-agent');
const { fileLogger } = require('./utils/aws-logger');
const logger = fileLogger('system-config-manager');

const credentialsFilePath = pathManager.getAWSCredentialsFilePath();
const configFilePath = pathManager.getAWSConfigFilePath();

export function setProfile(awsConfig: $TSAny, profileName: string) {
  fs.ensureDirSync(pathManager.getDotAWSDirPath());

  let credentials = {};
  let config = {};
  if (fs.existsSync(credentialsFilePath)) {
    logger('setProfile.credetialsFilePathExists', [credentialsFilePath])();
    makeFileOwnerReadWrite(credentialsFilePath);
    credentials = ini.parse(fs.readFileSync(credentialsFilePath, 'utf-8'));
  }

  if (fs.existsSync(configFilePath)) {
    logger('setProfile.credetialsFilePathExists', [credentialsFilePath])();
    makeFileOwnerReadWrite(configFilePath);
    config = ini.parse(fs.readFileSync(configFilePath, 'utf-8'));
  }

  let isCredSet = false;
  Object.keys(credentials).forEach(key => {
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
  Object.keys(config).forEach(key => {
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
  logger('setProfile.writecredetialsFilePath', [credentialsFilePath])();
  fs.writeFileSync(credentialsFilePath, ini.stringify(credentials), { mode: SecretFileMode });
  fs.writeFileSync(configFilePath, ini.stringify(config), { mode: SecretFileMode });
}

export async function getProfiledAwsConfig(context: $TSContext, profileName: string, isRoleSourceProfile?: boolean) {
  let awsConfig;
  const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
  const profileConfig = getProfileConfig(profileName);
  if (profileConfig) {
    logger('getProfiledAwsConfig.profileConfig', [profileConfig])();
    if (!isRoleSourceProfile && (profileConfig.role_arn || profileConfig.credential_process)) {
      const roleCredentials = await getRoleCredentials(context, profileName, profileConfig);
      delete profileConfig.role_arn;
      delete profileConfig.source_profile;
      awsConfig = {
        ...profileConfig,
        ...roleCredentials,
      };
    } else {
      logger('getProfiledAwsConfig.getProfileCredentials', [profileName]);
      const profileCredentials = getProfileCredentials(profileName);
      awsConfig = {
        ...profileConfig,
        ...profileCredentials,
      };
      validateCredentials(awsConfig, profileName);
    }
  } else {
    const err = new Error(`Profile configuration is missing for: ${profileName}`);
    logger('getProfiledAwsConfig', [profileName])(err);
    throw err;
  }

  if (httpProxy) {
    awsConfig = {
      ...awsConfig,
      httpOptions: { agent: proxyAgent(httpProxy) },
    };
  }

  return awsConfig;
}

function makeFileOwnerReadWrite(filePath: string) {
  logger('makeFileOwnerReadWrite', [filePath])();
  fs.chmodSync(filePath, '600');
}

async function getRoleCredentials(context: $TSContext, profileName: string, profileConfig: $TSAny) {
  const roleSessionName = profileConfig.role_session_name || 'amplify';
  let roleCredentials = getCachedRoleCredentials(profileConfig.role_arn, roleSessionName);

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
    logger('getRoleCredentials.aws.STS', [sourceProfileAwsConfig])();
    const sts = new aws.STS(sourceProfileAwsConfig);
    const assumeRoleRequest = {
      RoleArn: profileConfig.role_arn,
      RoleSessionName: roleSessionName,
      DurationSeconds: profileConfig.duration_seconds,
      ExternalId: profileConfig.external_id,
      SerialNumber: profileConfig.mfa_serial,
      TokenCode: mfaTokenCode,
    };
    const log = logger('getRoleCredentials.sts.assumeRole', [assumeRoleRequest]);
    try {
      log();
      const roleData = await sts.assumeRole(assumeRoleRequest).promise();
      roleCredentials = {
        accessKeyId: roleData.Credentials.AccessKeyId,
        secretAccessKey: roleData.Credentials.SecretAccessKey,
        sessionToken: roleData.Credentials.SessionToken,
        expiration: roleData.Credentials.Expiration,
      };
    } catch (ex) {
      log(ex);
    }
    if (profileConfig.role_arn && roleSessionName && roleCredentials) {
      cacheRoleCredentials(profileConfig.role_arn, roleSessionName, roleCredentials);
    }
  }

  return roleCredentials;
}

async function getMfaTokenCode() {
  const inputMfaTokenCode = {
    type: 'input',
    name: 'tokenCode',
    message: 'Enter the MFA token code:',
    validate: value => {
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

function cacheRoleCredentials(roleArn: string, sessionName: string, credentials: $TSAny) {
  let cacheContents = {};
  const cacheFilePath = getCacheFilePath();
  if (fs.existsSync(cacheFilePath)) {
    cacheContents = JSONUtilities.readJson(cacheFilePath);
  }
  cacheContents[roleArn] = cacheContents[roleArn] || {};
  cacheContents[roleArn][sessionName] = credentials;
  JSONUtilities.writeJson(cacheFilePath, cacheContents);
}

function getCachedRoleCredentials(roleArn: string, sessionName: string) {
  let roleCredentials;
  const cacheFilePath = getCacheFilePath();
  if (fs.existsSync(cacheFilePath)) {
    try {
      const cacheContents = JSONUtilities.readJson(cacheFilePath);
      if (cacheContents[roleArn]) {
        roleCredentials = cacheContents[roleArn][sessionName];
        roleCredentials = validateCachedCredentials(roleCredentials) ? roleCredentials : undefined;
      }
    } catch {
      return;
    }
  }
  return roleCredentials;
}

function validateCachedCredentials(roleCredentials: $TSAny) {
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

function isCredentialsExpired(roleCredentials: $TSAny) {
  let isExpired = true;

  if (roleCredentials && roleCredentials.expiration) {
    const TOTAL_MILLISECONDS_IN_ONE_MINUTE = 1000 * 60;
    const expirationDate = new Date(roleCredentials.expiration);
    isExpired = expirationDate.getTime() - Date.now() < TOTAL_MILLISECONDS_IN_ONE_MINUTE;
  }

  return isExpired;
}

export async function resetCache(context: $TSContext, profileName: string) {
  let awsConfig;
  const profileConfig = getProfileConfig(profileName);
  const cacheFilePath = getCacheFilePath();
  if (profileConfig && profileConfig.role_arn && fs.existsSync(cacheFilePath)) {
    const cacheContents = JSONUtilities.readJson(cacheFilePath);
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

function getCacheFilePath() {
  const sharedConfigDirPath = path.join(pathManager.getHomeDotAmplifyDirPath(), constants.Label);
  logger('getCacheFilePath', [sharedConfigDirPath])();
  fs.ensureDirSync(sharedConfigDirPath);
  return path.join(sharedConfigDirPath, constants.CacheFileName);
}

function getProfileConfig(profileName: string) {
  let profileConfig;
  logger('getProfileConfig', [profileName])();
  if (fs.existsSync(configFilePath)) {
    const config = ini.parse(fs.readFileSync(configFilePath, 'utf-8'));
    Object.keys(config).forEach(key => {
      const keyName = key.replace('profile', '').trim();
      if (profileName === keyName) {
        profileConfig = config[key];
      }
    });
  }
  return normalizeKeys(profileConfig);
}

export function getProfileCredentials(profileName: string) {
  let profileCredentials;
  logger('getProfileCredentials', [profileName])();
  if (fs.existsSync(credentialsFilePath)) {
    const credentials = ini.parse(fs.readFileSync(credentialsFilePath, 'utf-8'));

    Object.keys(credentials).forEach(key => {
      const keyName = key.trim();
      if (profileName === keyName) {
        profileCredentials = credentials[key];
      }
    });
  }
  profileCredentials = normalizeKeys(profileCredentials);
  return profileCredentials;
}

function validateCredentials(credentials: $TSAny, profileName: string) {
  const missingKeys = [];
  if (!credentials?.accessKeyId) {
    missingKeys.push('aws_access_key_id');
  }
  if (!credentials?.secretAccessKey) {
    missingKeys.push('aws_secret_access_key');
  }
  if (missingKeys.length > 0) {
    const err = new Error(`Profile configuration for '${profileName}' is invalid: missing ${missingKeys.join(', ')}`);
    logger('validateCredentials', [profileName])(err);
    err.stack = undefined;
    throw err;
  }
}

function normalizeKeys(config: $TSAny) {
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

export function getProfileRegion(profileName: string) {
  let profileRegion;
  logger('getProfileRegion', [profileName])();
  const profileConfig = getProfileConfig(profileName);
  if (profileConfig) {
    profileRegion = profileConfig.region;
  }
  logger('getProfileRegion', [profileRegion])();

  return profileRegion;
}

export function getNamedProfiles() {
  let namedProfiles;
  if (fs.existsSync(configFilePath)) {
    const config = ini.parse(fs.readFileSync(configFilePath, 'utf-8'));
    namedProfiles = {};
    Object.keys(config).forEach(key => {
      const profileName = key.replace('profile', '').trim();
      if (!namedProfiles[profileName]) {
        namedProfiles[profileName] = config[key];
      }
    });
  }
  return namedProfiles;
}
