"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class MaintenanceWindowLambdaParameters {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.MaintenanceWindowLambdaParameters = MaintenanceWindowLambdaParameters;
class NotificationConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.NotificationConfig = NotificationConfig;
class MaintenanceWindowAutomationParameters {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.MaintenanceWindowAutomationParameters = MaintenanceWindowAutomationParameters;
class TaskInvocationParameters {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.TaskInvocationParameters = TaskInvocationParameters;
class LoggingInfo {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.LoggingInfo = LoggingInfo;
class Target {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Target = Target;
class MaintenanceWindowStepFunctionsParameters {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.MaintenanceWindowStepFunctionsParameters = MaintenanceWindowStepFunctionsParameters;
class MaintenanceWindowRunCommandParameters {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.MaintenanceWindowRunCommandParameters = MaintenanceWindowRunCommandParameters;
class MaintenanceWindowTask extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::SSM::MaintenanceWindowTask', properties);
    }
}
MaintenanceWindowTask.MaintenanceWindowLambdaParameters = MaintenanceWindowLambdaParameters;
MaintenanceWindowTask.NotificationConfig = NotificationConfig;
MaintenanceWindowTask.MaintenanceWindowAutomationParameters = MaintenanceWindowAutomationParameters;
MaintenanceWindowTask.TaskInvocationParameters = TaskInvocationParameters;
MaintenanceWindowTask.LoggingInfo = LoggingInfo;
MaintenanceWindowTask.Target = Target;
MaintenanceWindowTask.MaintenanceWindowStepFunctionsParameters = MaintenanceWindowStepFunctionsParameters;
MaintenanceWindowTask.MaintenanceWindowRunCommandParameters = MaintenanceWindowRunCommandParameters;
exports.default = MaintenanceWindowTask;
