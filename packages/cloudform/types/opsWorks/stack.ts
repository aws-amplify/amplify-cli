/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class Source {
    Password?: Value<string>
    Revision?: Value<string>
    SshKey?: Value<string>
    Type?: Value<string>
    Url?: Value<string>
    Username?: Value<string>

    constructor(properties: Source) {
        Object.assign(this, properties)
    }
}

export class ChefConfiguration {
    BerkshelfVersion?: Value<string>
    ManageBerkshelf?: Value<boolean>

    constructor(properties: ChefConfiguration) {
        Object.assign(this, properties)
    }
}

export class StackConfigurationManager {
    Name?: Value<string>
    Version?: Value<string>

    constructor(properties: StackConfigurationManager) {
        Object.assign(this, properties)
    }
}

export class RdsDbInstance {
    DbPassword: Value<string>
    DbUser: Value<string>
    RdsDbInstanceArn: Value<string>

    constructor(properties: RdsDbInstance) {
        Object.assign(this, properties)
    }
}

export class ElasticIp {
    Ip: Value<string>
    Name?: Value<string>

    constructor(properties: ElasticIp) {
        Object.assign(this, properties)
    }
}

export interface StackProperties {
    AgentVersion?: Value<string>
    Attributes?: {[key: string]: Value<string>}
    ChefConfiguration?: ChefConfiguration
    CloneAppIds?: List<Value<string>>
    ClonePermissions?: Value<boolean>
    ConfigurationManager?: StackConfigurationManager
    CustomCookbooksSource?: Source
    CustomJson?: any
    DefaultAvailabilityZone?: Value<string>
    DefaultInstanceProfileArn: Value<string>
    DefaultOs?: Value<string>
    DefaultRootDeviceType?: Value<string>
    DefaultSshKeyName?: Value<string>
    DefaultSubnetId?: Value<string>
    EcsClusterArn?: Value<string>
    ElasticIps?: List<ElasticIp>
    HostnameTheme?: Value<string>
    Name: Value<string>
    RdsDbInstances?: List<RdsDbInstance>
    ServiceRoleArn: Value<string>
    SourceStackId?: Value<string>
    Tags?: ResourceTag[]
    UseCustomCookbooks?: Value<boolean>
    UseOpsworksSecurityGroups?: Value<boolean>
    VpcId?: Value<string>
}

export default class Stack extends ResourceBase {
    static Source = Source
    static ChefConfiguration = ChefConfiguration
    static StackConfigurationManager = StackConfigurationManager
    static RdsDbInstance = RdsDbInstance
    static ElasticIp = ElasticIp

    constructor(properties?: StackProperties) {
        super('AWS::OpsWorks::Stack', properties)
    }
}
