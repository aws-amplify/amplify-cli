/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class LoadBalancerInfo {
    ElbInfoList?: List<ELBInfo>
    TargetGroupInfoList?: List<TargetGroupInfo>

    constructor(properties: LoadBalancerInfo) {
        Object.assign(this, properties)
    }
}

export class RevisionLocation {
    GitHubLocation?: GitHubLocation
    RevisionType?: Value<string>
    S3Location?: S3Location

    constructor(properties: RevisionLocation) {
        Object.assign(this, properties)
    }
}

export class S3Location {
    Bucket: Value<string>
    BundleType?: Value<string>
    ETag?: Value<string>
    Key: Value<string>
    Version?: Value<string>

    constructor(properties: S3Location) {
        Object.assign(this, properties)
    }
}

export class TriggerConfig {
    TriggerEvents?: List<Value<string>>
    TriggerName?: Value<string>
    TriggerTargetArn?: Value<string>

    constructor(properties: TriggerConfig) {
        Object.assign(this, properties)
    }
}

export class TagFilter {
    Key?: Value<string>
    Type?: Value<string>
    Value?: Value<string>

    constructor(properties: TagFilter) {
        Object.assign(this, properties)
    }
}

export class GitHubLocation {
    CommitId: Value<string>
    Repository: Value<string>

    constructor(properties: GitHubLocation) {
        Object.assign(this, properties)
    }
}

export class TargetGroupInfo {
    Name?: Value<string>

    constructor(properties: TargetGroupInfo) {
        Object.assign(this, properties)
    }
}

export class ELBInfo {
    Name?: Value<string>

    constructor(properties: ELBInfo) {
        Object.assign(this, properties)
    }
}

export class AlarmConfiguration {
    Alarms?: List<Alarm>
    Enabled?: Value<boolean>
    IgnorePollAlarmFailure?: Value<boolean>

    constructor(properties: AlarmConfiguration) {
        Object.assign(this, properties)
    }
}

export class DeploymentStyle {
    DeploymentOption?: Value<string>
    DeploymentType?: Value<string>

    constructor(properties: DeploymentStyle) {
        Object.assign(this, properties)
    }
}

export class Alarm {
    Name?: Value<string>

    constructor(properties: Alarm) {
        Object.assign(this, properties)
    }
}

export class EC2TagFilter {
    Key?: Value<string>
    Type?: Value<string>
    Value?: Value<string>

    constructor(properties: EC2TagFilter) {
        Object.assign(this, properties)
    }
}

export class AutoRollbackConfiguration {
    Enabled?: Value<boolean>
    Events?: List<Value<string>>

    constructor(properties: AutoRollbackConfiguration) {
        Object.assign(this, properties)
    }
}

export class Deployment {
    Description?: Value<string>
    IgnoreApplicationStopFailures?: Value<boolean>
    Revision: RevisionLocation

    constructor(properties: Deployment) {
        Object.assign(this, properties)
    }
}

export interface DeploymentGroupProperties {
    AlarmConfiguration?: AlarmConfiguration
    ApplicationName: Value<string>
    AutoRollbackConfiguration?: AutoRollbackConfiguration
    AutoScalingGroups?: List<Value<string>>
    Deployment?: Deployment
    DeploymentConfigName?: Value<string>
    DeploymentGroupName?: Value<string>
    DeploymentStyle?: DeploymentStyle
    Ec2TagFilters?: List<EC2TagFilter>
    LoadBalancerInfo?: LoadBalancerInfo
    OnPremisesInstanceTagFilters?: List<TagFilter>
    ServiceRoleArn: Value<string>
    TriggerConfigurations?: List<TriggerConfig>
}

export default class DeploymentGroup extends ResourceBase {
    static LoadBalancerInfo = LoadBalancerInfo
    static RevisionLocation = RevisionLocation
    static S3Location = S3Location
    static TriggerConfig = TriggerConfig
    static TagFilter = TagFilter
    static GitHubLocation = GitHubLocation
    static TargetGroupInfo = TargetGroupInfo
    static ELBInfo = ELBInfo
    static AlarmConfiguration = AlarmConfiguration
    static DeploymentStyle = DeploymentStyle
    static Alarm = Alarm
    static EC2TagFilter = EC2TagFilter
    static AutoRollbackConfiguration = AutoRollbackConfiguration
    static Deployment = Deployment

    constructor(properties?: DeploymentGroupProperties) {
        super('AWS::CodeDeploy::DeploymentGroup', properties)
    }
}
