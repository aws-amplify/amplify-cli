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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAWSProfile = exports.getConfigFromProfile = void 0;
var util_1 = require("./util");
var path = __importStar(require("path"));
var fs = __importStar(require("fs-extra"));
var ini = __importStar(require("ini"));
var os = __importStar(require("os"));
var dotenv = __importStar(require("dotenv"));
var testRegionPool = ['ap-south-1', 'ap-northeast-1', 'ap-southeast-1', 'ap-northeast-2', 'ap-southeast-2'];
function getConfigFromProfile() {
    var dotAWSDirPath = path.normalize(path.join(os.homedir(), '.aws'));
    var credentialsFilePath = path.join(dotAWSDirPath, 'credentials');
    var configFilePath = path.join(dotAWSDirPath, 'config');
    var profileName = (0, util_1.getProfileName)();
    fs.ensureDirSync(dotAWSDirPath);
    var credentials = {};
    var config = {};
    if (fs.existsSync(credentialsFilePath)) {
        credentials = ini.parse(fs.readFileSync(credentialsFilePath, 'utf-8'));
    }
    if (fs.existsSync(configFilePath)) {
        config = ini.parse(fs.readFileSync(configFilePath, 'utf-8'));
    }
    var configKeyName = profileName === 'default' ? 'default' : "profile ".concat(profileName);
    if (!credentials[profileName] || !config[configKeyName]) {
        setupAWSProfile();
        credentials = ini.parse(fs.readFileSync(credentialsFilePath, 'utf-8'));
        config = ini.parse(fs.readFileSync(configFilePath, 'utf-8'));
    }
    return {
        accessKeyId: credentials[profileName].aws_access_key_id,
        secretAccessKey: credentials[profileName].aws_secret_access_key,
        sessionToken: credentials[profileName].aws_session_token,
        region: config[configKeyName].region,
    };
}
exports.getConfigFromProfile = getConfigFromProfile;
function setupAWSProfile() {
    dotenv.config();
    var dotAWSDirPath = path.normalize(path.join(os.homedir(), '.aws'));
    var credentialsFilePath = path.join(dotAWSDirPath, 'credentials');
    var configFilePath = path.join(dotAWSDirPath, 'config');
    var profileName = (0, util_1.getProfileName)();
    fs.ensureDirSync(dotAWSDirPath);
    var credentials = {};
    var config = {};
    if (fs.existsSync(credentialsFilePath)) {
        credentials = ini.parse(fs.readFileSync(credentialsFilePath, 'utf-8'));
    }
    if (fs.existsSync(configFilePath)) {
        config = ini.parse(fs.readFileSync(configFilePath, 'utf-8'));
    }
    var isCredSet = false;
    Object.keys(credentials).forEach(function (key) {
        var keyName = key.trim();
        if (profileName === keyName) {
            credentials[key].aws_access_key_id = process.env.AWS_ACCESS_KEY_ID;
            credentials[key].aws_secret_access_key = process.env.AWS_SECRET_ACCESS_KEY;
            if (process.env.AWS_SESSION_TOKEN) {
                credentials[key].aws_session_token = process.env.AWS_SESSION_TOKEN;
            }
            isCredSet = true;
        }
    });
    if (!isCredSet) {
        credentials[profileName] = {
            aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
            aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
        };
        if (process.env.AWS_SESSION_TOKEN) {
            credentials[profileName].aws_session_token = process.env.AWS_SESSION_TOKEN;
        }
    }
    process.env.CONSOLE_REGION = process.env.CONSOLE_REGION || testRegionPool[Math.floor(Math.random() * testRegionPool.length)];
    var isConfigSet = false;
    Object.keys(config).forEach(function (key) {
        var keyName = key.replace('profile', '').trim();
        if (profileName === keyName) {
            config[key].region = process.env.CONSOLE_REGION;
            isConfigSet = true;
        }
    });
    if (!isConfigSet) {
        var keyName = profileName === 'default' ? 'default' : "profile ".concat(profileName);
        config[keyName] = {
            region: process.env.CONSOLE_REGION,
        };
    }
    fs.writeFileSync(credentialsFilePath, ini.stringify(credentials));
    fs.writeFileSync(configFilePath, ini.stringify(config));
}
exports.setupAWSProfile = setupAWSProfile;
//# sourceMappingURL=profile-helper.js.map