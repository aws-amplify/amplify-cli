/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class MaintenanceWindowLambdaParameters {
    ClientContext?: Value<string>
    Qualifier?: Value<string>
    Payload?: Value<string>

    constructor(properties: MaintenanceWindowLambdaParameters) {
        Object.assign(this, properties)
    }
}

export class NotificationConfig {
    NotificationArn: Value<string>
    NotificationType?: Value<string>
    NotificationEvents?: List<Value<string>>

    constructor(properties: NotificationConfig) {
        Object.assign(this, properties)
    }
}

export class MaintenanceWindowAutomationParameters {
    Parameters?: any
    DocumentVersion?: Value<string>

    constructor(properties: MaintenanceWindowAutomationParameters) {
        Object.assign(this, properties)
    }
}

export class TaskInvocationParameters {
    MaintenanceWindowRunCommandParameters?: MaintenanceWindowRunCommandParameters
    MaintenanceWindowAutomationParameters?: MaintenanceWindowAutomationParameters
    MaintenanceWindowStepFunctionsParameters?: MaintenanceWindowStepFunctionsParameters
    MaintenanceWindowLambdaParameters?: MaintenanceWindowLambdaParameters

    constructor(properties: TaskInvocationParameters) {
        Object.assign(this, properties)
    }
}

export class LoggingInfo {
    S3Bucket: Value<string>
    Region: Value<string>
    S3Prefix?: Value<string>

    constructor(properties: LoggingInfo) {
        Object.assign(this, properties)
    }
}

export class Target {
    Values?: List<Value<string>>
    Key: Value<string>

    constructor(properties: Target) {
        Object.assign(this, properties)
    }
}

export class MaintenanceWindowStepFunctionsParameters {
    Input?: Value<string>
    Name?: Value<string>

    constructor(properties: MaintenanceWindowStepFunctionsParameters) {
        Object.assign(this, properties)
    }
}

export class MaintenanceWindowRunCommandParameters {
    TimeoutSeconds?: Value<number>
    Comment?: Value<string>
    OutputS3KeyPrefix?: Value<string>
    Parameters?: any
    DocumentHashType?: Value<string>
    ServiceRoleArn?: Value<string>
    NotificationConfig?: NotificationConfig
    OutputS3BucketName?: Value<string>
    DocumentHash?: Value<string>

    constructor(properties: MaintenanceWindowRunCommandParameters) {
        Object.assign(this, properties)
    }
}

export interface MaintenanceWindowTaskProperties {
    MaxErrors: Value<string>
    Description?: Value<string>
    ServiceRoleArn: Value<string>
    Priority: Value<number>
    MaxConcurrency: Value<string>
    Targets: List<Target>
    Name?: Value<string>
    TaskArn: Value<string>
    TaskInvocationParameters?: TaskInvocationParameters
    WindowId?: Value<string>
    TaskParameters?: any
    TaskType: Value<string>
    LoggingInfo?: LoggingInfo
}

export default class MaintenanceWindowTask extends ResourceBase {
    static MaintenanceWindowLambdaParameters = MaintenanceWindowLambdaParameters
    static NotificationConfig = NotificationConfig
    static MaintenanceWindowAutomationParameters = MaintenanceWindowAutomationParameters
    static TaskInvocationParameters = TaskInvocationParameters
    static LoggingInfo = LoggingInfo
    static Target = Target
    static MaintenanceWindowStepFunctionsParameters = MaintenanceWindowStepFunctionsParameters
    static MaintenanceWindowRunCommandParameters = MaintenanceWindowRunCommandParameters

    constructor(properties?: MaintenanceWindowTaskProperties) {
        super('AWS::SSM::MaintenanceWindowTask', properties)
    }
}
