import { $TSAny, $TSContext, AmplifyError, JSONUtilities, pathManager, SecretFileMode, spinner } from '@aws-amplify/amplify-cli-core';

import { STSClient, AssumeRoleCommand, AssumeRoleCommandInput } from '@aws-sdk/client-sts';
import { fromProcess } from '@aws-sdk/credential-providers';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as ini from 'ini';
import * as inquirer from 'inquirer';
import * as constants from './constants';
import { fileLogger } from './utils/aws-logger';
import { AwsSdkConfig } from './utils/auth-types';
import { proxyAgent } from './aws-utils/aws-globals';

const logger = fileLogger('system-config-manager');

const credentialsFilePath = pathManager.getAWSCredentialsFilePath();
const configFilePath = pathManager.getAWSConfigFilePath();

/**
 * Sets aws profile credentials in ~/.aws/credentials
 */
export const setProfile = (awsConfigInfo: $TSAny, profileName: string): void => {
  fs.ensureDirSync(pathManager.getDotAWSDirPath());

  let credentials = {};
  let config = {};
  if (fs.existsSync(credentialsFilePath)) {
    logger('setProfile.credentialsFilePathExists', [credentialsFilePath])();
    makeFileOwnerReadWrite(credentialsFilePath);
    credentials = ini.parse(fs.readFileSync(credentialsFilePath, 'utf-8'));
  }

  if (fs.existsSync(configFilePath)) {
    logger('setProfile.configFilePathExists', [configFilePath])();
    makeFileOwnerReadWrite(configFilePath);
    config = ini.parse(fs.readFileSync(configFilePath, 'utf-8'));
  }

  let isCredSet = false;
  Object.keys(credentials).forEach((key) => {
    const keyName = key.trim();
    if (profileName === keyName) {
      credentials[key].aws_access_key_id = awsConfigInfo.accessKeyId;
      credentials[key].aws_secret_access_key = awsConfigInfo.secretAccessKey;
      isCredSet = true;
    }
  });
  if (!isCredSet) {
    credentials[profileName] = {
      aws_access_key_id: awsConfigInfo.accessKeyId,
      aws_secret_access_key: awsConfigInfo.secretAccessKey,
    };
  }

  let isConfigSet = false;
  Object.keys(config).forEach((key) => {
    const keyName = key.replace('profile', '').trim();
    if (profileName === keyName) {
      config[key].region = awsConfigInfo.region;
      isConfigSet = true;
    }
  });
  if (!isConfigSet) {
    const keyName = profileName === 'default' ? 'default' : `profile ${profileName}`;
    config[keyName] = {
      region: awsConfigInfo.region,
    };
  }
  logger('setProfile.writeCredentialsFilePath', [credentialsFilePath])();
  fs.writeFileSync(credentialsFilePath, ini.stringify(credentials), { mode: SecretFileMode });
  fs.writeFileSync(configFilePath, ini.stringify(config), { mode: SecretFileMode });
};

/**
 * Gets AWS configuration for a profile
 */
export const getProfiledAwsConfig = async (
  context: $TSContext,
  profileName: string,
  isRoleSourceProfile?: boolean,
): Promise<AwsSdkConfig> => {
  let awsConfigInfo: AwsSdkConfig;
  const profileConfig = getProfileConfig(profileName);
  if (profileConfig) {
    logger('getProfiledAwsConfig.profileConfig', [profileConfig])();
    if (!isRoleSourceProfile && profileConfig.role_arn) {
      const roleCredentials = await getRoleCredentials(context, profileName, profileConfig);
      delete profileConfig.role_arn;
      delete profileConfig.source_profile;
      awsConfigInfo = {
        ...profileConfig,
        ...roleCredentials,
      };
    } else if (profileConfig.credential_process) {
      // need to force AWS_SDK_LOAD_CONFIG to a truthy value to force credential process to prefer the credential process in ~/.aws/config instead of ~/.aws/credentials
      const sdkLoadConfigOriginal = process.env.AWS_SDK_LOAD_CONFIG;
      process.env.AWS_SDK_LOAD_CONFIG = '1';
      const credentials = await fromProcess({ profile: profileName })();

      awsConfigInfo = {
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
          expiration: credentials.expiration,
        },
        region: profileConfig.region,
        requestHandler: new NodeHttpHandler({
          httpAgent: proxyAgent(),
          httpsAgent: proxyAgent(),
        }),
      };
      process.env.AWS_SDK_LOAD_CONFIG = sdkLoadConfigOriginal;
    } else {
      logger('getProfiledAwsConfig.getProfileCredentials', [profileName]);
      const profileCredentials = getProfileCredentials(profileName);
      awsConfigInfo = {
        ...profileConfig,
        credentials: {
          ...profileCredentials,
        },
      };
      validateCredentials(awsConfigInfo, profileName);
    }
  } else {
    throw new AmplifyError('ProfileConfigurationError', {
      message: `Profile configuration is missing for: ${profileName}`,
    });
  }
  return awsConfigInfo;
};

const makeFileOwnerReadWrite = (filePath: string): void => {
  logger('makeFileOwnerReadWrite', [filePath])();
  fs.chmodSync(filePath, '600');
};

const getRoleCredentials = async (context: $TSContext, profileName: string, profileConfig: $TSAny): Promise<$TSAny> => {
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

    const stsClient = new STSClient({
      ...sourceProfileAwsConfig,
    });

    const assumeRoleRequest: AssumeRoleCommandInput = {
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
      const command = new AssumeRoleCommand(assumeRoleRequest);
      const roleData = await stsClient.send(command);

      if (roleData.Credentials) {
        roleCredentials = {
          credentials: {
            accessKeyId: roleData.Credentials.AccessKeyId,
            secretAccessKey: roleData.Credentials.SecretAccessKey,
            sessionToken: roleData.Credentials.SessionToken,
            expiration: roleData.Credentials.Expiration,
          },
        };
      }
    } catch (ex) {
      log(ex);
    }
    if (profileConfig.role_arn && roleSessionName && roleCredentials) {
      cacheRoleCredentials(profileConfig.role_arn, roleSessionName, roleCredentials);
    }
  }

  return roleCredentials;
};

const getMfaTokenCode = async (): Promise<string> => {
  let shouldResumeSpinning = false;
  if (spinner.isSpinning) {
    spinner.stopAndPersist();
    shouldResumeSpinning = true;
  }
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
  const answer: { tokenCode: string } = await inquirer.prompt(inputMfaTokenCode as $TSAny);
  if (shouldResumeSpinning) spinner.start();
  return answer.tokenCode;
};

const cacheRoleCredentials = (roleArn: string, sessionName: string, credentials: $TSAny): void => {
  let cacheContents = {};
  const cacheFilePath = getCacheFilePath();
  if (fs.existsSync(cacheFilePath)) {
    cacheContents = JSONUtilities.readJson(cacheFilePath);
  }
  cacheContents[roleArn] = cacheContents[roleArn] || {};
  cacheContents[roleArn][sessionName] = credentials;
  JSONUtilities.writeJson(cacheFilePath, cacheContents);
};

const getCachedRoleCredentials = (roleArn: string, sessionName: string): $TSAny => {
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
      return undefined;
    }
  }
  return {
    credentials: {
      ...roleCredentials,
    },
  };
};

const validateCachedCredentials = (roleCredentials: $TSAny): boolean => {
  let isValid = false;

  if (roleCredentials) {
    isValid =
      !isCredentialsExpired(roleCredentials) &&
      roleCredentials.accessKeyId &&
      roleCredentials.secretAccessKey &&
      roleCredentials.sessionToken;
  }

  return isValid;
};

const isCredentialsExpired = (roleCredentials: $TSAny): boolean => {
  let isExpired = true;

  if (roleCredentials && roleCredentials.expiration) {
    const TOTAL_MILLISECONDS_IN_ONE_MINUTE = 1000 * 60;
    const expirationDate = new Date(roleCredentials.expiration);
    isExpired = expirationDate.getTime() - Date.now() < TOTAL_MILLISECONDS_IN_ONE_MINUTE;
  }

  return isExpired;
};

/**
 * Clears temporary cached credentials
 */
export const resetCache = async (context: $TSContext, profileName: string): Promise<$TSAny> => {
  let awsConfigInfo;

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

  return awsConfigInfo;
};

const getCacheFilePath = (): string => {
  const sharedConfigDirPath = path.join(pathManager.getHomeDotAmplifyDirPath(), constants.Label);
  logger('getCacheFilePath', [sharedConfigDirPath])();
  fs.ensureDirSync(sharedConfigDirPath);
  return path.join(sharedConfigDirPath, constants.CacheFileName);
};

const getProfileConfig = (profileName: string): $TSAny => {
  let profileConfig;
  logger('getProfileConfig', [profileName])();
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
};

/**
 * Gets credentials for a given profile
 */
export const getProfileCredentials = (profileName: string): $TSAny => {
  let profileCredentials;
  logger('getProfileCredentials', [profileName])();
  if (fs.existsSync(credentialsFilePath)) {
    const credentials = ini.parse(fs.readFileSync(credentialsFilePath, 'utf-8'));

    Object.keys(credentials).forEach((key) => {
      const keyName = key.trim();
      if (profileName === keyName) {
        profileCredentials = credentials[key];
      }
    });
  }
  profileCredentials = normalizeKeys(profileCredentials);
  return profileCredentials;
};

const validateCredentials = (credentials: $TSAny, profileName: string): void => {
  const missingKeys = [];
  if (!credentials?.credentials.accessKeyId && !process.env.AWS_ACCESS_KEY_ID) {
    missingKeys.push('aws_access_key_id');
  }
  if (!credentials?.credentials.secretAccessKey && !process.env.AWS_SECRET_ACCESS_KEY) {
    missingKeys.push('aws_secret_access_key');
  }
  if (missingKeys.length > 0) {
    throw new AmplifyError('ProfileConfigurationError', {
      message: `Profile configuration for '${profileName}' is invalid: missing ${missingKeys.join(', ')}`,
    });
  }
};

const normalizeKeys = (config: $TSAny): $TSAny => {
  const configClone = { ...config };
  if (configClone) {
    configClone.accessKeyId = config.accessKeyId || config.aws_access_key_id;
    configClone.secretAccessKey = config.secretAccessKey || config.aws_secret_access_key;
    configClone.sessionToken = config.sessionToken || config.aws_session_token;
    delete configClone.aws_access_key_id;
    delete configClone.aws_secret_access_key;
    delete configClone.aws_session_token;
  }
  return configClone;
};

/**
 * Gets configured region for the given profile
 */
export const getProfileRegion = (profileName: string): string => {
  let profileRegion;
  logger('getProfileRegion', [profileName])();
  const profileConfig = getProfileConfig(profileName);
  if (profileConfig) {
    profileRegion = profileConfig.region;
  }
  logger('getProfileRegion', [profileRegion])();

  return profileRegion;
};

/**
 * Gets a list of all profiles
 */
export const getNamedProfiles = (): $TSAny => {
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
};
