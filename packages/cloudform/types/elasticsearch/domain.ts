/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class VPCOptions {
    SecurityGroupIds?: List<Value<string>>
    SubnetIds?: List<Value<string>>

    constructor(properties: VPCOptions) {
        Object.assign(this, properties)
    }
}

export class ElasticsearchClusterConfig {
    DedicatedMasterCount?: Value<number>
    DedicatedMasterEnabled?: Value<boolean>
    DedicatedMasterType?: Value<string>
    InstanceCount?: Value<number>
    InstanceType?: Value<string>
    ZoneAwarenessEnabled?: Value<boolean>

    constructor(properties: ElasticsearchClusterConfig) {
        Object.assign(this, properties)
    }
}

export class SnapshotOptions {
    AutomatedSnapshotStartHour?: Value<number>

    constructor(properties: SnapshotOptions) {
        Object.assign(this, properties)
    }
}

export class EBSOptions {
    EBSEnabled?: Value<boolean>
    Iops?: Value<number>
    VolumeSize?: Value<number>
    VolumeType?: Value<string>

    constructor(properties: EBSOptions) {
        Object.assign(this, properties)
    }
}

export class EncryptionAtRestOptions {
    Enabled?: Value<boolean>
    KmsKeyId?: Value<string>

    constructor(properties: EncryptionAtRestOptions) {
        Object.assign(this, properties)
    }
}

export interface DomainProperties {
    AccessPolicies?: any
    AdvancedOptions?: {[key: string]: Value<string>}
    DomainName?: Value<string>
    EBSOptions?: EBSOptions
    ElasticsearchClusterConfig?: ElasticsearchClusterConfig
    ElasticsearchVersion?: Value<string>
    EncryptionAtRestOptions?: EncryptionAtRestOptions
    SnapshotOptions?: SnapshotOptions
    Tags?: ResourceTag[]
    VPCOptions?: VPCOptions
}

export default class Domain extends ResourceBase {
    static VPCOptions = VPCOptions
    static ElasticsearchClusterConfig = ElasticsearchClusterConfig
    static SnapshotOptions = SnapshotOptions
    static EBSOptions = EBSOptions
    static EncryptionAtRestOptions = EncryptionAtRestOptions

    constructor(properties?: DomainProperties) {
        super('AWS::Elasticsearch::Domain', properties)
    }
}
