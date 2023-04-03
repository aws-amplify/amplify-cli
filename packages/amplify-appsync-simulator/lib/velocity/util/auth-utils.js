"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authUtils = void 0;
const type_definition_1 = require("../../type-definition");
const authUtils = (context) => ({
    authType() {
        if (context.requestAuthorizationMode === type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY) {
            return 'API Key Authorization';
        }
        else if (context.requestAuthorizationMode === type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM) {
            return 'IAM Authorization';
        }
        else if (context.requestAuthorizationMode === type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS) {
            return 'User Pool Authorization';
        }
        else if (context.requestAuthorizationMode === type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT) {
            return 'Open ID Connect Authorization';
        }
        return 'API Key Authorization';
    },
});
exports.authUtils = authUtils;
//# sourceMappingURL=auth-utils.js.map