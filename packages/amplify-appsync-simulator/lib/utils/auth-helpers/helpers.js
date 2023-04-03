"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllowedAuthTypes = exports.extractHeader = exports.isValidOIDCToken = exports.extractIamToken = exports.extractJwtToken = void 0;
const jwt_decode_1 = __importDefault(require("jwt-decode"));
const type_definition_1 = require("../../type-definition");
function extractJwtToken(authorization) {
    try {
        return (0, jwt_decode_1.default)(authorization);
    }
    catch (_) {
        return undefined;
    }
}
exports.extractJwtToken = extractJwtToken;
function extractIamToken(authorization, appSyncConfig) {
    var _a;
    const accessKeyId = authorization.includes('Credential=') ? (_a = authorization.split('Credential=')[1]) === null || _a === void 0 ? void 0 : _a.split('/')[0] : undefined;
    if (!accessKeyId) {
        throw new Error('missing accessKeyId');
    }
    if (accessKeyId === appSyncConfig.authAccessKeyId) {
        return {
            accountId: appSyncConfig.accountId,
            userArn: `arn:aws:sts::${appSyncConfig.accountId}:${appSyncConfig.authRoleName}`,
            username: 'auth-user',
        };
    }
    else {
        return {
            accountId: appSyncConfig.accountId,
            userArn: `arn:aws:sts::${appSyncConfig.accountId}:${appSyncConfig.unAuthRoleName}`,
            username: 'unauth-user',
        };
    }
}
exports.extractIamToken = extractIamToken;
function isValidOIDCToken(token, configuredAuthTypes) {
    const oidcIssuers = configuredAuthTypes
        .filter((authType) => authType.authenticationType === type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT)
        .map((auth) => auth.openIDConnectConfig.Issuer && auth.openIDConnectConfig.Issuer.endsWith('/')
        ? auth.openIDConnectConfig.Issuer.substring(0, auth.openIDConnectConfig.Issuer.length - 1)
        : auth.openIDConnectConfig.Issuer);
    const tokenIssuer = token.iss.endsWith('/') ? token.iss.substring(0, token.iss.length - 1) : token.iss;
    return oidcIssuers.length > 0 && oidcIssuers.includes(tokenIssuer);
}
exports.isValidOIDCToken = isValidOIDCToken;
function extractHeader(headers, name) {
    const headerName = Object.keys(headers).find((header) => header.toLowerCase() === name.toLowerCase());
    const headerValue = headerName && headers[headerName];
    return headerValue ? (Array.isArray(headerValue) ? headerValue[0] : headerValue) : undefined;
}
exports.extractHeader = extractHeader;
function getAllowedAuthTypes(config) {
    return [config.defaultAuthenticationType, ...config.additionalAuthenticationProviders].map((authType) => authType.authenticationType);
}
exports.getAllowedAuthTypes = getAllowedAuthTypes;
//# sourceMappingURL=helpers.js.map