"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminBackendMap = exports.getTempCredsWithAdminTokens = exports.isAmplifyAdminApp = exports.doAdminTokensExist = exports.adminVerifyUrl = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const lodash_1 = __importDefault(require("lodash"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const proxy_agent_1 = __importDefault(require("proxy-agent"));
const admin_login_1 = require("../admin-login");
const adminVerifyUrl = (appId, envName, region) => {
    var _a, _b;
    const baseUrl = (_a = process.env.AMPLIFY_CLI_ADMINUI_BASE_URL) !== null && _a !== void 0 ? _a : (_b = exports.adminBackendMap[region]) === null || _b === void 0 ? void 0 : _b.amplifyAdminUrl;
    return `${baseUrl}/admin/${appId}/${envName}/verify/?loginVersion=1`;
};
exports.adminVerifyUrl = adminVerifyUrl;
function doAdminTokensExist(appId) {
    if (!appId) {
        throw new amplify_cli_core_1.AmplifyError('AmplifyStudioError', {
            message: `Failed to check if admin credentials exist: appId is undefined`,
        });
    }
    return !!amplify_cli_core_1.stateManager.getAmplifyAdminConfigEntry(appId);
}
exports.doAdminTokensExist = doAdminTokensExist;
async function isAmplifyAdminApp(appId) {
    if (!appId) {
        throw new amplify_cli_core_1.AmplifyError('AmplifyStudioError', {
            message: `Failed to check if Amplify Studio is enabled: appId is undefined`,
        });
    }
    let appState = await getAdminAppState(appId, 'us-east-1');
    if (appState.appId && appState.region && appState.region !== 'us-east-1') {
        appState = await getAdminAppState(appId, appState.region);
    }
    const userPoolID = appState.loginAuthConfig ? JSON.parse(appState.loginAuthConfig).aws_user_pools_id : '';
    return { isAdminApp: !!appState.appId, region: appState.region, userPoolID };
}
exports.isAmplifyAdminApp = isAmplifyAdminApp;
async function getTempCredsWithAdminTokens(context, appId) {
    if (!doAdminTokensExist(appId)) {
        await (0, admin_login_1.adminLoginFlow)(context, appId);
    }
    const authConfig = await getRefreshedTokens(context, appId);
    const { idToken, IdentityId, region } = authConfig;
    const awsConfigInfo = await getAdminCognitoCredentials(idToken, IdentityId, region);
    aws_sdk_1.default.config.update(awsConfigInfo);
    return await getAdminStsCredentials(idToken, region);
}
exports.getTempCredsWithAdminTokens = getTempCredsWithAdminTokens;
async function getAdminAppState(appId, region) {
    var _a;
    const appStateBaseUrl = (_a = process.env.AMPLIFY_CLI_APPSTATE_BASE_URL) !== null && _a !== void 0 ? _a : exports.adminBackendMap[region].appStateUrl;
    const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
    const fetchOptions = httpProxy ? { agent: (0, proxy_agent_1.default)(httpProxy) } : {};
    const res = await (0, node_fetch_1.default)(`${appStateBaseUrl}/AppState/?appId=${appId}`, fetchOptions);
    return res.json();
}
async function getAdminCognitoCredentials(idToken, identityId, region) {
    const cognitoIdentity = new aws_sdk_1.default.CognitoIdentity({ region });
    const login = idToken.payload.iss.replace('https://', '');
    const { Credentials } = await cognitoIdentity
        .getCredentialsForIdentity({
        IdentityId: identityId,
        Logins: {
            [login]: idToken.jwtToken,
        },
    })
        .promise();
    return {
        accessKeyId: Credentials.AccessKeyId,
        expiration: Credentials.Expiration,
        region,
        secretAccessKey: Credentials.SecretKey,
        sessionToken: Credentials.SessionToken,
    };
}
async function getAdminStsCredentials(idToken, region) {
    const sts = new aws_sdk_1.default.STS({
        stsRegionalEndpoints: 'regional',
    });
    const { Credentials } = await sts
        .assumeRole({
        RoleArn: idToken.payload['cognito:preferred_role'],
        RoleSessionName: 'amplifyadmin',
    })
        .promise();
    return {
        accessKeyId: Credentials.AccessKeyId,
        expiration: Credentials.Expiration,
        region,
        secretAccessKey: Credentials.SecretAccessKey,
        sessionToken: Credentials.SessionToken,
    };
}
async function getRefreshedTokens(context, appId) {
    const authConfig = amplify_cli_core_1.stateManager.getAmplifyAdminConfigEntry(appId);
    if (isJwtExpired(authConfig.idToken)) {
        let refreshedTokens;
        try {
            refreshedTokens = (await refreshJWTs(authConfig)).AuthenticationResult;
            authConfig.accessToken.jwtToken = refreshedTokens.AccessToken;
            authConfig.idToken.jwtToken = refreshedTokens.IdToken;
            amplify_cli_core_1.stateManager.setAmplifyAdminConfigEntry(appId, authConfig);
        }
        catch (_a) {
            await (0, admin_login_1.adminLoginFlow)(context, appId, null, authConfig.region);
        }
    }
    return authConfig;
}
function isJwtExpired(token) {
    const expiration = lodash_1.default.get(token, ['payload', 'exp'], 0);
    const secSinceEpoch = Math.round(new Date().getTime() / 1000);
    return secSinceEpoch >= expiration - 60;
}
async function refreshJWTs(authConfig) {
    const CognitoISP = new aws_sdk_1.default.CognitoIdentityServiceProvider({ region: authConfig.region });
    return await CognitoISP.initiateAuth({
        AuthFlow: 'REFRESH_TOKEN',
        AuthParameters: {
            REFRESH_TOKEN: authConfig.refreshToken.token,
        },
        ClientId: authConfig.accessToken.payload.client_id,
    }).promise();
}
exports.adminBackendMap = {
    'ap-northeast-1': {
        amplifyAdminUrl: 'https://ap-northeast-1.admin.amplifyapp.com',
        appStateUrl: 'https://prod.ap-northeast-1.appstate.amplifyapp.com',
    },
    'ap-northeast-2': {
        amplifyAdminUrl: 'https://ap-northeast-2.admin.amplifyapp.com',
        appStateUrl: 'https://prod.ap-northeast-2.appstate.amplifyapp.com',
    },
    'ap-south-1': {
        amplifyAdminUrl: 'https://ap-south-1.admin.amplifyapp.com',
        appStateUrl: 'https://prod.ap-south-1.appstate.amplifyapp.com',
    },
    'ap-southeast-1': {
        amplifyAdminUrl: 'https://ap-southeast-1.admin.amplifyapp.com',
        appStateUrl: 'https://prod.ap-southeast-1.appstate.amplifyapp.com',
    },
    'ap-southeast-2': {
        amplifyAdminUrl: 'https://ap-southeast-2.admin.amplifyapp.com',
        appStateUrl: 'https://prod.ap-southeast-2.appstate.amplifyapp.com',
    },
    'ca-central-1': {
        amplifyAdminUrl: 'https://ca-central-1.admin.amplifyapp.com',
        appStateUrl: 'https://prod.ca-central-1.appstate.amplifyapp.com',
    },
    'eu-central-1': {
        amplifyAdminUrl: 'https://eu-central-1.admin.amplifyapp.com',
        appStateUrl: 'https://prod.eu-central-1.appstate.amplifyapp.com',
    },
    'eu-north-1': {
        amplifyAdminUrl: 'https://eu-north-1.admin.amplifyapp.com',
        appStateUrl: 'https://prod.eu-north-1.appstate.amplifyapp.com',
    },
    'eu-south-1': {
        amplifyAdminUrl: 'https://eu-south-1.admin.amplifyapp.com',
        appStateUrl: 'https://prod.eu-south-1.appstate.amplifyapp.com',
    },
    'eu-west-1': {
        amplifyAdminUrl: 'https://eu-west-1.admin.amplifyapp.com',
        appStateUrl: 'https://prod.eu-west-1.appstate.amplifyapp.com',
    },
    'eu-west-2': {
        amplifyAdminUrl: 'https://eu-west-2.admin.amplifyapp.com',
        appStateUrl: 'https://prod.eu-west-2.appstate.amplifyapp.com',
    },
    'eu-west-3': {
        amplifyAdminUrl: 'https://eu-west-3.admin.amplifyapp.com',
        appStateUrl: 'https://prod.eu-west-3.appstate.amplifyapp.com',
    },
    'me-south-1': {
        amplifyAdminUrl: 'https://me-south-1.admin.amplifyapp.com',
        appStateUrl: 'https://prod.me-south-1.appstate.amplifyapp.com',
    },
    'sa-east-1': {
        amplifyAdminUrl: 'https://sa-east-1.admin.amplifyapp.com',
        appStateUrl: 'https://prod.sa-east-1.appstate.amplifyapp.com',
    },
    'us-east-1': {
        amplifyAdminUrl: 'https://us-east-1.admin.amplifyapp.com',
        appStateUrl: 'https://prod.us-east-1.appstate.amplifyapp.com',
    },
    'us-east-2': {
        amplifyAdminUrl: 'https://us-east-2.admin.amplifyapp.com',
        appStateUrl: 'https://prod.us-east-2.appstate.amplifyapp.com',
    },
    'us-west-1': {
        amplifyAdminUrl: 'https://us-west-1.admin.amplifyapp.com',
        appStateUrl: 'https://prod.us-west-1.appstate.amplifyapp.com',
    },
    'us-west-2': {
        amplifyAdminUrl: 'https://us-west-2.admin.amplifyapp.com',
        appStateUrl: 'https://prod.us-west-2.appstate.amplifyapp.com',
    },
};
//# sourceMappingURL=admin-helpers.js.map