"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIAMToken = exports.getGenericToken = exports.getJWTToken = exports.VelocityTemplateSimulator = void 0;
const uuid_1 = require("uuid");
const amplify_appsync_simulator_1 = require("@aws-amplify/amplify-appsync-simulator");
const DEFAULT_SCHEMA = `
  type Query {
    noop: String
  }`;
class VelocityTemplateSimulator {
    constructor(opts) {
        this.gqlSimulator = new amplify_appsync_simulator_1.AmplifyAppSyncSimulator();
        this.gqlSimulator.init({
            schema: {
                content: DEFAULT_SCHEMA,
            },
            appSync: {
                name: 'appsyncAPI',
                defaultAuthenticationType: opts.authConfig.defaultAuthentication,
                additionalAuthenticationProviders: opts.authConfig
                    .additionalAuthenticationProviders,
            },
        });
    }
    render(template, payload) {
        var _a;
        const ctxParameters = { source: {}, arguments: { input: {} }, stash: {}, ...payload.context };
        const vtlInfo = { fieldNodes: [], fragments: {}, path: { key: '' }, ...((_a = payload.info) !== null && _a !== void 0 ? _a : {}) };
        const vtlTemplate = new amplify_appsync_simulator_1.VelocityTemplate({ content: template }, this.gqlSimulator);
        return vtlTemplate.render(ctxParameters, payload.requestParameters, vtlInfo);
    }
}
exports.VelocityTemplateSimulator = VelocityTemplateSimulator;
const getJWTToken = (userPool, username, email, groups = [], tokenType = 'id') => {
    const token = {
        iss: `https://cognito-idp.us-west-2.amazonaws.com/us-west-2_${userPool}`,
        sub: (0, uuid_1.v4)(),
        aud: '75pk49boud2olipfda0ke3snic',
        exp: Math.floor(Date.now() / 1000) + 10000,
        iat: Math.floor(Date.now() / 1000),
        event_id: (0, uuid_1.v4)(),
        token_use: tokenType,
        auth_time: Math.floor(Date.now() / 1000),
        'cognito:username': username,
        'cognito:groups': groups,
        email,
    };
    return token;
};
exports.getJWTToken = getJWTToken;
const getGenericToken = (username, email, groups = [], tokenType = 'id') => {
    return {
        iss: 'https://some-oidc-provider/auth',
        sub: (0, uuid_1.v4)(),
        aud: '75pk49boud2olipfda0ke3snic',
        exp: Math.floor(Date.now() / 1000) + 10000,
        iat: Math.floor(Date.now() / 1000),
        event_id: (0, uuid_1.v4)(),
        token_use: tokenType,
        auth_time: Math.floor(Date.now() / 1000),
        username,
        email,
        groups,
    };
};
exports.getGenericToken = getGenericToken;
const getIAMToken = (username, identityInfo) => {
    let iamRoleName = username;
    if (identityInfo === null || identityInfo === void 0 ? void 0 : identityInfo.cognitoIdentityAuthType) {
        iamRoleName = identityInfo.cognitoIdentityAuthType === 'authenticated' ? 'authRole' : 'unauthRole';
    }
    return {
        username,
        userArn: `arn:aws:sts::123456789012:assumed-role/${iamRoleName}/CognitoIdentityCredentials`,
        accountId: '123456789012',
        cognitoIdentityPoolId: identityInfo === null || identityInfo === void 0 ? void 0 : identityInfo.cognitoIdentityPoolId,
        cognitoIdentityAuthProvider: identityInfo === null || identityInfo === void 0 ? void 0 : identityInfo.cognitoIdentityAuthProvider,
        cognitoIdentityId: identityInfo === null || identityInfo === void 0 ? void 0 : identityInfo.cognitoIdentityId,
        cognitoIdentityAuthType: identityInfo === null || identityInfo === void 0 ? void 0 : identityInfo.cognitoIdentityAuthType,
    };
};
exports.getIAMToken = getIAMToken;
//# sourceMappingURL=index.js.map