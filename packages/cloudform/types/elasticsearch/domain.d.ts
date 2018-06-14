import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class VPCOptions {
    SecurityGroupIds?: List<Value<string>>;
    SubnetIds?: List<Value<string>>;
    constructor(properties: VPCOptions);
}
export declare class ElasticsearchClusterConfig {
    DedicatedMasterCount?: Value<number>;
    DedicatedMasterEnabled?: Value<boolean>;
    DedicatedMasterType?: Value<string>;
    InstanceCount?: Value<number>;
    InstanceType?: Value<string>;
    ZoneAwarenessEnabled?: Value<boolean>;
    constructor(properties: ElasticsearchClusterConfig);
}
export declare class SnapshotOptions {
    AutomatedSnapshotStartHour?: Value<number>;
    constructor(properties: SnapshotOptions);
}
export declare class EBSOptions {
    EBSEnabled?: Value<boolean>;
    Iops?: Value<number>;
    VolumeSize?: Value<number>;
    VolumeType?: Value<string>;
    constructor(properties: EBSOptions);
}
export interface DomainProperties {
    AccessPolicies?: any;
    AdvancedOptions?: {
        [key: string]: Value<string>;
    };
    DomainName?: Value<string>;
    EBSOptions?: EBSOptions;
    ElasticsearchClusterConfig?: ElasticsearchClusterConfig;
    ElasticsearchVersion?: Value<string>;
    SnapshotOptions?: SnapshotOptions;
    Tags?: ResourceTag[];
    VPCOptions?: VPCOptions;
}
export default class Domain extends ResourceBase {
    static VPCOptions: typeof VPCOptions;
    static ElasticsearchClusterConfig: typeof ElasticsearchClusterConfig;
    static SnapshotOptions: typeof SnapshotOptions;
    static EBSOptions: typeof EBSOptions;
    constructor(properties?: DomainProperties);
}
