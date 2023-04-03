"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expectAuthParametersMatch = exports.expectDynamoDBLocalAndOGMetaFilesOutputMatching = exports.expectDynamoDBProjectDetailsMatch = exports.expectS3LocalAndOGMetaFilesOutputMatching = exports.expectLocalTeamInfoHasOnlyAuthCategoryAndNoStorage = exports.expectNoStorageInMeta = exports.expectStorageProjectDetailsMatch = exports.expectLocalAndPulledAwsExportsMatching = exports.expectLocalAndPulledBackendAmplifyMetaMatching = exports.expectLocalAndPulledBackendConfigMatching = exports.expectApiHasCorrectAuthConfig = exports.expectLocalTeamInfoHasNoCategories = exports.expectNoAuthInMeta = exports.expectAuthLocalAndOGMetaFilesOutputMatching = exports.expectLocalAndCloudMetaFilesMatching = exports.expectAuthProjectDetailsMatch = void 0;
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var _1 = require(".");
var awsExports_1 = require("../aws-exports/awsExports");
var expectAuthProjectDetailsMatch = function (projectDetails, ogProjectDetails) {
    expect(projectDetails.parameters.authSelections).toEqual(ogProjectDetails.parameters.authSelections);
    expect(projectDetails.meta.UserPoolId).toEqual(ogProjectDetails.meta.UserPoolId);
    expect(projectDetails.meta.AppClientID).toEqual(ogProjectDetails.meta.AppClientID);
    expect(projectDetails.meta.AppClientIDWeb).toEqual(ogProjectDetails.meta.AppClientIDWeb);
    expect(projectDetails.meta.HostedUIDomain).toEqual(ogProjectDetails.meta.HostedUIDomain);
    if (projectDetails.meta.OAuthMetadata) {
        expect(ogProjectDetails.meta.OAuthMetadata).toBeDefined();
        expect(projectDetails.meta.OAuthMetadata.AllowedOAuthFlows).toEqual(ogProjectDetails.meta.OAuthMetadata.AllowedOAuthFlows);
        expect(projectDetails.meta.OAuthMetadata.AllowedOAuthScopes.sort()).toEqual(ogProjectDetails.meta.OAuthMetadata.AllowedOAuthScopes.sort());
        expect(projectDetails.meta.OAuthMetadata.CallbackURLs).toEqual(ogProjectDetails.meta.OAuthMetadata.CallbackURLs);
        expect(projectDetails.meta.OAuthMetadata.LogoutURLs).toEqual(ogProjectDetails.meta.OAuthMetadata.LogoutURLs);
    }
    expect(projectDetails.team.userPoolId).toEqual(ogProjectDetails.team.userPoolId);
    expect(projectDetails.team.webClientId).toEqual(ogProjectDetails.team.webClientId);
    expect(projectDetails.team.nativeClientId).toEqual(ogProjectDetails.team.nativeClientId);
};
exports.expectAuthProjectDetailsMatch = expectAuthProjectDetailsMatch;
var expectLocalAndCloudMetaFilesMatching = function (projectRoot) {
    var cloudMeta = (0, amplify_e2e_core_1.getProjectMeta)(projectRoot);
    var meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
    expect(cloudMeta).toMatchObject(meta);
};
exports.expectLocalAndCloudMetaFilesMatching = expectLocalAndCloudMetaFilesMatching;
var expectAuthLocalAndOGMetaFilesOutputMatching = function (projectRoot, ogProjectRoot) {
    var meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
    var ogMeta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(ogProjectRoot);
    var authMeta = Object.keys(meta.auth)
        .filter(function (key) { return meta.auth[key].service === 'Cognito'; })
        .map(function (key) { return meta.auth[key]; })[0];
    var ogAuthMeta = Object.keys(ogMeta.auth)
        .filter(function (key) { return ogMeta.auth[key].service === 'Cognito'; })
        .map(function (key) { return ogMeta.auth[key]; })[0];
    expect(authMeta.output.AppClientID).toEqual(ogAuthMeta.output.AppClientID);
    expect(authMeta.output.AppClientIDWeb).toEqual(ogAuthMeta.output.AppClientIDWeb);
    expect(authMeta.output.HostedUIDomain).toEqual(ogAuthMeta.output.HostedUIDomain);
    expect(authMeta.output.UserPoolId).toEqual(ogAuthMeta.output.UserPoolId);
};
exports.expectAuthLocalAndOGMetaFilesOutputMatching = expectAuthLocalAndOGMetaFilesOutputMatching;
var expectNoAuthInMeta = function (projectRoot) {
    var meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
    expect(meta.auth).toBeDefined();
    expect(meta.auth).toMatchObject({});
};
exports.expectNoAuthInMeta = expectNoAuthInMeta;
var expectLocalTeamInfoHasNoCategories = function (projectRoot) {
    var team = (0, amplify_e2e_core_1.getTeamProviderInfo)(projectRoot);
    // eslint-disable-next-line spellcheck/spell-checker
    expect(team.integtest.categories).toBeUndefined();
};
exports.expectLocalTeamInfoHasNoCategories = expectLocalTeamInfoHasNoCategories;
// eslint-disable-next-line @typescript-eslint/no-shadow
var expectApiHasCorrectAuthConfig = function (projectRoot, __, userPoolId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    var meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
    // eslint-disable-next-line spellcheck/spell-checker
    var authConfig = (_c = (_b = (_a = meta.api) === null || _a === void 0 ? void 0 : _a.auimpup) === null || _b === void 0 ? void 0 : _b.output) === null || _c === void 0 ? void 0 : _c.authConfig;
    expect(authConfig).toBeDefined();
    expect((_d = authConfig.defaultAuthentication) === null || _d === void 0 ? void 0 : _d.authenticationType).toEqual('AMAZON_COGNITO_USER_POOLS');
    expect((_f = (_e = authConfig.defaultAuthentication) === null || _e === void 0 ? void 0 : _e.userPoolConfig) === null || _f === void 0 ? void 0 : _f.userPoolId).toEqual(userPoolId);
    var rootStack = (0, _1.readRootStack)(projectRoot);
    // eslint-disable-next-line spellcheck/spell-checker
    expect((_k = (_j = (_h = (_g = rootStack.Resources) === null || _g === void 0 ? void 0 : _g.apiauimpup) === null || _h === void 0 ? void 0 : _h.Properties) === null || _j === void 0 ? void 0 : _j.Parameters) === null || _k === void 0 ? void 0 : _k.AuthCognitoUserPoolId).toEqual(userPoolId);
};
exports.expectApiHasCorrectAuthConfig = expectApiHasCorrectAuthConfig;
var expectLocalAndPulledBackendConfigMatching = function (projectRoot, projectRootPull) {
    var backendConfig = (0, amplify_e2e_core_1.getBackendConfig)(projectRoot);
    var backendConfigPull = (0, amplify_e2e_core_1.getBackendConfig)(projectRootPull);
    expect(backendConfig).toMatchObject(backendConfigPull);
};
exports.expectLocalAndPulledBackendConfigMatching = expectLocalAndPulledBackendConfigMatching;
var expectLocalAndPulledBackendAmplifyMetaMatching = function (projectRoot, projectRootPull) {
    var amplifyMeta = deepRemoveObjectKey((0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot), 'lastPushTimeStamp');
    var amplifyMetaPull = deepRemoveObjectKey((0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRootPull), 'lastPushTimeStamp');
    expect(amplifyMeta).toMatchObject(amplifyMetaPull);
};
exports.expectLocalAndPulledBackendAmplifyMetaMatching = expectLocalAndPulledBackendAmplifyMetaMatching;
var expectLocalAndPulledAwsExportsMatching = function (projectRoot, projectRootPull) {
    var awsExports = (0, awsExports_1.getAWSExports)(projectRoot);
    var awsExportsPull = (0, awsExports_1.getAWSExports)(projectRootPull);
    expect(awsExports).toMatchObject(awsExportsPull);
};
exports.expectLocalAndPulledAwsExportsMatching = expectLocalAndPulledAwsExportsMatching;
var expectStorageProjectDetailsMatch = function (projectDetails, ogProjectDetails) {
    expect(projectDetails.parameters.resourceName).toEqual(ogProjectDetails.parameters.resourceName);
    expect(projectDetails.meta.BucketName).toEqual(ogProjectDetails.meta.BucketName);
    expect(projectDetails.meta.Region).toEqual(ogProjectDetails.meta.Region);
    expect(projectDetails.team.bucketName).toEqual(ogProjectDetails.meta.BucketName);
    expect(projectDetails.team.region).toEqual(ogProjectDetails.meta.Region);
};
exports.expectStorageProjectDetailsMatch = expectStorageProjectDetailsMatch;
var expectNoStorageInMeta = function (projectRoot) {
    var meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
    expect(meta.storage).toBeDefined();
    expect(meta.storage).toMatchObject({});
};
exports.expectNoStorageInMeta = expectNoStorageInMeta;
var expectLocalTeamInfoHasOnlyAuthCategoryAndNoStorage = function (projectRoot) {
    var team = (0, amplify_e2e_core_1.getTeamProviderInfo)(projectRoot);
    /* eslint-disable spellcheck/spell-checker */
    expect(team.integtest.categories).toBeDefined();
    expect(team.integtest.categories.auth).toBeDefined();
    expect(team.integtest.categories.storage).toBeUndefined();
    /* eslint-enable spellcheck/spell-checker */
};
exports.expectLocalTeamInfoHasOnlyAuthCategoryAndNoStorage = expectLocalTeamInfoHasOnlyAuthCategoryAndNoStorage;
var expectS3LocalAndOGMetaFilesOutputMatching = function (projectRoot, ogProjectRoot) {
    var meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
    var ogMeta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(ogProjectRoot);
    var storageMeta = Object.keys(meta.storage)
        .filter(function (key) { return meta.storage[key].service === 'S3'; })
        .map(function (key) { return meta.storage[key]; })[0];
    var ogStorageMeta = Object.keys(ogMeta.storage)
        .filter(function (key) { return ogMeta.storage[key].service === 'S3'; })
        .map(function (key) { return ogMeta.storage[key]; })[0];
    expect(storageMeta.output.BucketName).toEqual(ogStorageMeta.output.BucketName);
    expect(storageMeta.output.Region).toEqual(ogStorageMeta.output.Region);
};
exports.expectS3LocalAndOGMetaFilesOutputMatching = expectS3LocalAndOGMetaFilesOutputMatching;
var expectDynamoDBProjectDetailsMatch = function (projectDetails, ogProjectDetails) {
    expect(projectDetails.meta.Name).toEqual(ogProjectDetails.meta.Name);
    expect(projectDetails.meta.Region).toEqual(ogProjectDetails.meta.Region);
    expect(projectDetails.meta.PartitionKeyName).toEqual(ogProjectDetails.meta.PartitionKeyName);
    expect(projectDetails.meta.PartitionKeyType).toEqual(ogProjectDetails.meta.PartitionKeyType);
    expect(projectDetails.meta.SortKeyName).toEqual(ogProjectDetails.meta.SortKeyName);
    expect(projectDetails.meta.SortKeyType).toEqual(ogProjectDetails.meta.SortKeyType);
    expect(projectDetails.meta.Arn).toEqual(ogProjectDetails.meta.Arn);
    expect(projectDetails.meta.StreamArn).toEqual(ogProjectDetails.meta.StreamArn);
    expect(projectDetails.team.tableName).toEqual(ogProjectDetails.meta.Name);
    expect(projectDetails.team.region).toEqual(ogProjectDetails.meta.Region);
    expect(projectDetails.team.partitionKeyName).toEqual(ogProjectDetails.meta.PartitionKeyName);
    expect(projectDetails.team.partitionKeyType).toEqual(ogProjectDetails.meta.PartitionKeyType);
    expect(projectDetails.team.sortKeyName).toEqual(ogProjectDetails.meta.SortKeyName);
    expect(projectDetails.team.sortKeyType).toEqual(ogProjectDetails.meta.SortKeyType);
    expect(projectDetails.team.arn).toEqual(ogProjectDetails.meta.Arn);
    expect(projectDetails.team.streamArn).toEqual(ogProjectDetails.meta.StreamArn);
};
exports.expectDynamoDBProjectDetailsMatch = expectDynamoDBProjectDetailsMatch;
var expectDynamoDBLocalAndOGMetaFilesOutputMatching = function (projectRoot, ogProjectRoot) {
    var meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
    var ogMeta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(ogProjectRoot);
    var storageMeta = Object.keys(meta.storage)
        .filter(function (key) { return meta.storage[key].service === 'DynamoDB'; })
        .map(function (key) { return meta.storage[key]; })[0];
    var ogStorageMeta = Object.keys(ogMeta.storage)
        .filter(function (key) { return ogMeta.storage[key].service === 'DynamoDB'; })
        .map(function (key) { return ogMeta.storage[key]; })[0];
    expect(storageMeta.output.Name).toEqual(ogStorageMeta.output.Name);
    expect(storageMeta.output.Region).toEqual(ogStorageMeta.output.Region);
    expect(storageMeta.output.PartitionKeyName).toEqual(ogStorageMeta.output.PartitionKeyName);
    expect(storageMeta.output.PartitionKeyType).toEqual(ogStorageMeta.output.PartitionKeyType);
    expect(storageMeta.output.SortKeyName).toEqual(ogStorageMeta.output.SortKeyName);
    expect(storageMeta.output.SortKeyType).toEqual(ogStorageMeta.output.SortKeyType);
    expect(storageMeta.output.Arn).toEqual(ogStorageMeta.output.Arn);
    expect(storageMeta.output.StreamArn).toEqual(ogStorageMeta.output.StreamArn);
};
exports.expectDynamoDBLocalAndOGMetaFilesOutputMatching = expectDynamoDBLocalAndOGMetaFilesOutputMatching;
var expectAuthParametersMatch = function (authParameters, ogAuthParameters) {
    expect(authParameters.authProvidersUserPool).toEqual(ogAuthParameters.authProvidersUserPool);
    expect(authParameters.requiredAttributes).toEqual(ogAuthParameters.requiredAttributes);
    expect(authParameters.passwordPolicyMinLength).toEqual(ogAuthParameters.passwordPolicyMinLength);
    expect(authParameters.passwordPolicyCharacters).toEqual(ogAuthParameters.passwordPolicyCharacters);
    expect(authParameters.mfaConfiguration).toEqual(ogAuthParameters.mfaConfiguration);
    expect(authParameters.autoVerifiedAttributes).toEqual(ogAuthParameters.autoVerifiedAttributes);
};
exports.expectAuthParametersMatch = expectAuthParametersMatch;
var deepRemoveObjectKey = function (obj, key) {
    Object.keys(obj).forEach(function (objKey) {
        if (typeof obj[objKey] === 'object') {
            // eslint-disable-next-line no-param-reassign
            obj[objKey] = deepRemoveObjectKey(obj[objKey], key);
        }
        else if (objKey === key) {
            // eslint-disable-next-line no-param-reassign
            delete obj[objKey];
        }
    });
    return obj;
};
//# sourceMappingURL=expects.js.map