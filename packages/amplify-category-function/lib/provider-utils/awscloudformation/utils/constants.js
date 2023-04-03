"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advancedSettingsList = exports.LegacyFilename = exports.CronExpressionsMode = exports.ServiceName = exports.environmentVariableSetting = exports.LayerCfnLogicalNamePrefix = exports.lambdaPackageLimitInMB = exports.cfnTemplateSuffix = exports.versionHash = exports.ephemeralField = exports.updateVersionPermissionsField = exports.deleteVersionsField = exports.description = exports.accessPermissions = exports.secretsConfiguration = exports.lambdaLayerSetting = exports.cronJobSetting = exports.resourceAccessSetting = exports.appsyncTableSuffix = exports.provider = exports.parametersFileName = exports.layerConfigurationFileName = exports.functionParametersFileName = exports.chooseServiceMessageUpdate = exports.chooseServiceMessageAdd = void 0;
exports.chooseServiceMessageAdd = 'Select which capability you want to add:';
exports.chooseServiceMessageUpdate = 'Select which capability you want to update:';
exports.functionParametersFileName = 'function-parameters.json';
exports.layerConfigurationFileName = 'layer-configuration.json';
exports.parametersFileName = 'parameters.json';
exports.provider = 'awscloudformation';
exports.appsyncTableSuffix = '@model(appsync)';
exports.resourceAccessSetting = 'Resource access permissions';
exports.cronJobSetting = 'Scheduled recurring invocation';
exports.lambdaLayerSetting = 'Lambda layers configuration';
exports.secretsConfiguration = 'Secret values configuration';
exports.accessPermissions = 'Access permissions';
exports.description = 'Description';
exports.deleteVersionsField = 'layerVersionsToDelete';
exports.updateVersionPermissionsField = 'layerVersionPermissionsToUpdate';
exports.ephemeralField = 'ephemeral';
exports.versionHash = 'latestPushedVersionHash';
exports.cfnTemplateSuffix = '-awscloudformation-template.json';
exports.lambdaPackageLimitInMB = 250;
var LayerCfnLogicalNamePrefix;
(function (LayerCfnLogicalNamePrefix) {
    LayerCfnLogicalNamePrefix["LambdaLayerVersion"] = "LambdaLayerVersion";
    LayerCfnLogicalNamePrefix["LambdaLayerVersionPermission"] = "LambdaLayerPermission";
})(LayerCfnLogicalNamePrefix = exports.LayerCfnLogicalNamePrefix || (exports.LayerCfnLogicalNamePrefix = {}));
exports.environmentVariableSetting = 'Environment variables configuration';
var ServiceName;
(function (ServiceName) {
    ServiceName["LambdaFunction"] = "Lambda";
    ServiceName["LambdaLayer"] = "LambdaLayer";
})(ServiceName = exports.ServiceName || (exports.ServiceName = {}));
var CronExpressionsMode;
(function (CronExpressionsMode) {
    CronExpressionsMode["Minutes"] = "Minutes";
    CronExpressionsMode["Hourly"] = "Hourly";
    CronExpressionsMode["Daily"] = "Daily";
    CronExpressionsMode["Weekly"] = "Weekly";
    CronExpressionsMode["Monthly"] = "Monthly";
    CronExpressionsMode["Yearly"] = "Yearly";
    CronExpressionsMode["Custom"] = "Custom AWS cron expression";
})(CronExpressionsMode = exports.CronExpressionsMode || (exports.CronExpressionsMode = {}));
var LegacyFilename;
(function (LegacyFilename) {
    LegacyFilename["layerParameters"] = "layer-parameters.json";
    LegacyFilename["layerRuntimes"] = "layer-runtimes.json";
})(LegacyFilename = exports.LegacyFilename || (exports.LegacyFilename = {}));
exports.advancedSettingsList = [
    exports.resourceAccessSetting,
    exports.cronJobSetting,
    exports.lambdaLayerSetting,
    exports.environmentVariableSetting,
    exports.secretsConfiguration,
];
//# sourceMappingURL=constants.js.map