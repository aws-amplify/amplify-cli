export declare const chooseServiceMessageAdd = "Select which capability you want to add:";
export declare const chooseServiceMessageUpdate = "Select which capability you want to update:";
export declare const functionParametersFileName = "function-parameters.json";
export declare const layerConfigurationFileName = "layer-configuration.json";
export declare const parametersFileName = "parameters.json";
export declare const provider = "awscloudformation";
export declare const appsyncTableSuffix = "@model(appsync)";
export declare const resourceAccessSetting = "Resource access permissions";
export declare const cronJobSetting = "Scheduled recurring invocation";
export declare const lambdaLayerSetting = "Lambda layers configuration";
export declare const secretsConfiguration = "Secret values configuration";
export declare const accessPermissions = "Access permissions";
export declare const description = "Description";
export declare const deleteVersionsField = "layerVersionsToDelete";
export declare const updateVersionPermissionsField = "layerVersionPermissionsToUpdate";
export declare const ephemeralField = "ephemeral";
export declare const versionHash = "latestPushedVersionHash";
export declare const cfnTemplateSuffix = "-awscloudformation-template.json";
export declare const lambdaPackageLimitInMB = 250;
export declare const enum LayerCfnLogicalNamePrefix {
    LambdaLayerVersion = "LambdaLayerVersion",
    LambdaLayerVersionPermission = "LambdaLayerPermission"
}
export declare const environmentVariableSetting = "Environment variables configuration";
export declare const enum ServiceName {
    LambdaFunction = "Lambda",
    LambdaLayer = "LambdaLayer"
}
export declare const enum CronExpressionsMode {
    Minutes = "Minutes",
    Hourly = "Hourly",
    Daily = "Daily",
    Weekly = "Weekly",
    Monthly = "Monthly",
    Yearly = "Yearly",
    Custom = "Custom AWS cron expression"
}
export declare const enum LegacyFilename {
    layerParameters = "layer-parameters.json",
    layerRuntimes = "layer-runtimes.json"
}
export declare const advancedSettingsList: string[];
//# sourceMappingURL=constants.d.ts.map