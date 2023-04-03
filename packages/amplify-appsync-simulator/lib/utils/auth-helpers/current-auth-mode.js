"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthorizationMode = void 0;
const type_definition_1 = require("../../type-definition");
const helpers_1 = require("./helpers");
function getAuthorizationMode(headers, appSyncConfig) {
    const apiKey = (0, helpers_1.extractHeader)(headers, 'x-api-key');
    const rawAuthHeader = (0, helpers_1.extractHeader)(headers, 'Authorization');
    const authorization = Array.isArray(rawAuthHeader) ? rawAuthHeader[0] : rawAuthHeader;
    const jwtToken = (0, helpers_1.extractJwtToken)(authorization);
    const allowedAuthTypes = (0, helpers_1.getAllowedAuthTypes)(appSyncConfig);
    const isApiKeyAllowed = allowedAuthTypes.includes(type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY);
    const isIamAllowed = allowedAuthTypes.includes(type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM);
    const isCupAllowed = allowedAuthTypes.includes(type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS);
    const isOidcAllowed = allowedAuthTypes.includes(type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT);
    if (isApiKeyAllowed) {
        if (apiKey) {
            if (appSyncConfig.apiKey === apiKey) {
                return type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY;
            }
            throw new Error('UnauthorizedException: Invalid API key');
        }
    }
    if (authorization) {
        if (isIamAllowed) {
            const isSignatureV4Token = authorization.startsWith('AWS4-HMAC-SHA256');
            if (isSignatureV4Token) {
                return type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM;
            }
        }
        if (jwtToken) {
            if (isCupAllowed) {
                const isCupToken = jwtToken.iss.startsWith('https://cognito-idp.');
                if (isCupToken) {
                    return type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS;
                }
            }
            if (isOidcAllowed) {
                const isOidcToken = (0, helpers_1.isValidOIDCToken)(jwtToken, [
                    appSyncConfig.defaultAuthenticationType,
                    ...appSyncConfig.additionalAuthenticationProviders,
                ]);
                if (isOidcToken) {
                    return type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT;
                }
            }
        }
        throw new Error('UnauthorizedException: Invalid JWT token');
    }
    throw new Error('UnauthorizedException: Missing authorization');
}
exports.getAuthorizationMode = getAuthorizationMode;
//# sourceMappingURL=current-auth-mode.js.map