"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifyAppSyncSimulatorAuthenticationType = exports.AppSyncSimulatorDataSourceType = exports.RESOLVER_KIND = void 0;
var RESOLVER_KIND;
(function (RESOLVER_KIND) {
    RESOLVER_KIND["UNIT"] = "UNIT";
    RESOLVER_KIND["PIPELINE"] = "PIPELINE";
})(RESOLVER_KIND = exports.RESOLVER_KIND || (exports.RESOLVER_KIND = {}));
var AppSyncSimulatorDataSourceType;
(function (AppSyncSimulatorDataSourceType) {
    AppSyncSimulatorDataSourceType["DynamoDB"] = "AMAZON_DYNAMODB";
    AppSyncSimulatorDataSourceType["Lambda"] = "AWS_LAMBDA";
    AppSyncSimulatorDataSourceType["OpenSearch"] = "AMAZON_ELASTICSEARCH";
    AppSyncSimulatorDataSourceType["None"] = "NONE";
})(AppSyncSimulatorDataSourceType = exports.AppSyncSimulatorDataSourceType || (exports.AppSyncSimulatorDataSourceType = {}));
var AmplifyAppSyncSimulatorAuthenticationType;
(function (AmplifyAppSyncSimulatorAuthenticationType) {
    AmplifyAppSyncSimulatorAuthenticationType["API_KEY"] = "API_KEY";
    AmplifyAppSyncSimulatorAuthenticationType["AWS_IAM"] = "AWS_IAM";
    AmplifyAppSyncSimulatorAuthenticationType["AMAZON_COGNITO_USER_POOLS"] = "AMAZON_COGNITO_USER_POOLS";
    AmplifyAppSyncSimulatorAuthenticationType["OPENID_CONNECT"] = "OPENID_CONNECT";
    AmplifyAppSyncSimulatorAuthenticationType["AWS_LAMBDA"] = "AWS_LAMBDA";
})(AmplifyAppSyncSimulatorAuthenticationType = exports.AmplifyAppSyncSimulatorAuthenticationType || (exports.AmplifyAppSyncSimulatorAuthenticationType = {}));
//# sourceMappingURL=type-definition.js.map