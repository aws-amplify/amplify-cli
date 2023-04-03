"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNamedProfiles = exports.getProfileRegion = exports.getProfileCredentials = exports.resetCache = exports.getProfiledAwsConfig = exports.setProfile = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const aws_sdk_1 = require("aws-sdk");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const ini = __importStar(require("ini"));
const inquirer = __importStar(require("inquirer"));
const proxy_agent_1 = __importDefault(require("proxy-agent"));
const constants = __importStar(require("./constants"));
const aws_logger_1 = require("./utils/aws-logger");
const logger = (0, aws_logger_1.fileLogger)('system-config-manager');
const credentialsFilePath = amplify_cli_core_1.pathManager.getAWSCredentialsFilePath();
const configFilePath = amplify_cli_core_1.pathManager.getAWSConfigFilePath();
const setProfile = (awsConfigInfo, profileName) => {
    fs.ensureDirSync(amplify_cli_core_1.pathManager.getDotAWSDirPath());
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
    fs.writeFileSync(credentialsFilePath, ini.stringify(credentials), { mode: amplify_cli_core_1.SecretFileMode });
    fs.writeFileSync(configFilePath, ini.stringify(config), { mode: amplify_cli_core_1.SecretFileMode });
};
exports.setProfile = setProfile;
const getProfiledAwsConfig = async (context, profileName, isRoleSourceProfile) => {
    let awsConfigInfo;
    const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
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
        }
        else if (profileConfig.credential_process) {
            const sdkLoadConfigOriginal = process.env.AWS_SDK_LOAD_CONFIG;
            process.env.AWS_SDK_LOAD_CONFIG = '1';
            const chain = new aws_sdk_1.CredentialProviderChain();
            const processProvider = () => new aws_sdk_1.ProcessCredentials({ profile: profileName });
            chain.providers.push(processProvider);
            const credentials = await chain.resolvePromise();
            awsConfigInfo = {
                region: profileConfig.region,
                accessKeyId: credentials.accessKeyId,
                secretAccessKey: credentials.secretAccessKey,
                sessionToken: credentials.sessionToken,
                expiration: credentials.expireTime,
            };
            process.env.AWS_SDK_LOAD_CONFIG = sdkLoadConfigOriginal;
        }
        else {
            logger('getProfiledAwsConfig.getProfileCredentials', [profileName]);
            const profileCredentials = (0, exports.getProfileCredentials)(profileName);
            awsConfigInfo = {
                ...profileConfig,
                ...profileCredentials,
            };
            validateCredentials(awsConfigInfo, profileName);
        }
    }
    else {
        throw new amplify_cli_core_1.AmplifyError('ProfileConfigurationError', {
            message: `Profile configuration is missing for: ${profileName}`,
        });
    }
    if (httpProxy) {
        awsConfigInfo = {
            ...awsConfigInfo,
            httpOptions: { agent: (0, proxy_agent_1.default)(httpProxy) },
        };
    }
    return awsConfigInfo;
};
exports.getProfiledAwsConfig = getProfiledAwsConfig;
const makeFileOwnerReadWrite = (filePath) => {
    logger('makeFileOwnerReadWrite', [filePath])();
    fs.chmodSync(filePath, '600');
};
const getRoleCredentials = async (context, profileName, profileConfig) => {
    const roleSessionName = profileConfig.role_session_name || 'amplify';
    let roleCredentials = getCachedRoleCredentials(profileConfig.role_arn, roleSessionName);
    if (!roleCredentials) {
        const sourceProfileAwsConfig = profileConfig.source_profile
            ? await (0, exports.getProfiledAwsConfig)(context, profileConfig.source_profile, true)
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
        const sts = new aws_sdk_1.STS(sourceProfileAwsConfig);
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
        }
        catch (ex) {
            log(ex);
        }
        if (profileConfig.role_arn && roleSessionName && roleCredentials) {
            cacheRoleCredentials(profileConfig.role_arn, roleSessionName, roleCredentials);
        }
    }
    return roleCredentials;
};
const getMfaTokenCode = async () => {
    let shouldResumeSpinning = false;
    if (amplify_cli_core_1.spinner.isSpinning) {
        amplify_cli_core_1.spinner.stopAndPersist();
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
    const answer = await inquirer.prompt(inputMfaTokenCode);
    if (shouldResumeSpinning)
        amplify_cli_core_1.spinner.start();
    return answer.tokenCode;
};
const cacheRoleCredentials = (roleArn, sessionName, credentials) => {
    let cacheContents = {};
    const cacheFilePath = getCacheFilePath();
    if (fs.existsSync(cacheFilePath)) {
        cacheContents = amplify_cli_core_1.JSONUtilities.readJson(cacheFilePath);
    }
    cacheContents[roleArn] = cacheContents[roleArn] || {};
    cacheContents[roleArn][sessionName] = credentials;
    amplify_cli_core_1.JSONUtilities.writeJson(cacheFilePath, cacheContents);
};
const getCachedRoleCredentials = (roleArn, sessionName) => {
    let roleCredentials;
    const cacheFilePath = getCacheFilePath();
    if (fs.existsSync(cacheFilePath)) {
        try {
            const cacheContents = amplify_cli_core_1.JSONUtilities.readJson(cacheFilePath);
            if (cacheContents[roleArn]) {
                roleCredentials = cacheContents[roleArn][sessionName];
                roleCredentials = validateCachedCredentials(roleCredentials) ? roleCredentials : undefined;
            }
        }
        catch (_a) {
            return undefined;
        }
    }
    return roleCredentials;
};
const validateCachedCredentials = (roleCredentials) => {
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
const isCredentialsExpired = (roleCredentials) => {
    let isExpired = true;
    if (roleCredentials && roleCredentials.expiration) {
        const TOTAL_MILLISECONDS_IN_ONE_MINUTE = 1000 * 60;
        const expirationDate = new Date(roleCredentials.expiration);
        isExpired = expirationDate.getTime() - Date.now() < TOTAL_MILLISECONDS_IN_ONE_MINUTE;
    }
    return isExpired;
};
const resetCache = async (context, profileName) => {
    let awsConfigInfo;
    const profileConfig = getProfileConfig(profileName);
    const cacheFilePath = getCacheFilePath();
    if (profileConfig && profileConfig.role_arn && fs.existsSync(cacheFilePath)) {
        const cacheContents = amplify_cli_core_1.JSONUtilities.readJson(cacheFilePath);
        if (cacheContents[profileConfig.role_arn]) {
            delete cacheContents[profileConfig.role_arn];
            const jsonString = JSON.stringify(cacheContents, null, 4);
            fs.writeFileSync(cacheFilePath, jsonString, 'utf8');
            context.print.success('  Cached temp credentials are deleted for the project.');
            context.print.info('');
        }
        else {
            context.print.info('  No temp credentials are cached for the project.');
            context.print.info('');
        }
    }
    else {
        context.print.info('  No temp credentials are cached for the project.');
        context.print.info('');
    }
    return awsConfigInfo;
};
exports.resetCache = resetCache;
const getCacheFilePath = () => {
    const sharedConfigDirPath = path.join(amplify_cli_core_1.pathManager.getHomeDotAmplifyDirPath(), constants.Label);
    logger('getCacheFilePath', [sharedConfigDirPath])();
    fs.ensureDirSync(sharedConfigDirPath);
    return path.join(sharedConfigDirPath, constants.CacheFileName);
};
const getProfileConfig = (profileName) => {
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
const getProfileCredentials = (profileName) => {
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
exports.getProfileCredentials = getProfileCredentials;
const validateCredentials = (credentials, profileName) => {
    const missingKeys = [];
    if (!(credentials === null || credentials === void 0 ? void 0 : credentials.accessKeyId) && !process.env.AWS_ACCESS_KEY_ID) {
        missingKeys.push('aws_access_key_id');
    }
    if (!(credentials === null || credentials === void 0 ? void 0 : credentials.secretAccessKey) && !process.env.AWS_SECRET_ACCESS_KEY) {
        missingKeys.push('aws_secret_access_key');
    }
    if (missingKeys.length > 0) {
        throw new amplify_cli_core_1.AmplifyError('ProfileConfigurationError', {
            message: `Profile configuration for '${profileName}' is invalid: missing ${missingKeys.join(', ')}`,
        });
    }
};
const normalizeKeys = (config) => {
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
const getProfileRegion = (profileName) => {
    let profileRegion;
    logger('getProfileRegion', [profileName])();
    const profileConfig = getProfileConfig(profileName);
    if (profileConfig) {
        profileRegion = profileConfig.region;
    }
    logger('getProfileRegion', [profileRegion])();
    return profileRegion;
};
exports.getProfileRegion = getProfileRegion;
const getNamedProfiles = () => {
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
exports.getNamedProfiles = getNamedProfiles;
//# sourceMappingURL=system-config-manager.js.map