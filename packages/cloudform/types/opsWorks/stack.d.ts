import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class Source {
    Password?: Value<string>;
    Revision?: Value<string>;
    SshKey?: Value<string>;
    Type?: Value<string>;
    Url?: Value<string>;
    Username?: Value<string>;
    constructor(properties: Source);
}
export declare class ChefConfiguration {
    BerkshelfVersion?: Value<string>;
    ManageBerkshelf?: Value<boolean>;
    constructor(properties: ChefConfiguration);
}
export declare class StackConfigurationManager {
    Name?: Value<string>;
    Version?: Value<string>;
    constructor(properties: StackConfigurationManager);
}
export declare class RdsDbInstance {
    DbPassword: Value<string>;
    DbUser: Value<string>;
    RdsDbInstanceArn: Value<string>;
    constructor(properties: RdsDbInstance);
}
export declare class ElasticIp {
    Ip: Value<string>;
    Name?: Value<string>;
    constructor(properties: ElasticIp);
}
export interface StackProperties {
    AgentVersion?: Value<string>;
    Attributes?: {
        [key: string]: Value<string>;
    };
    ChefConfiguration?: ChefConfiguration;
    CloneAppIds?: List<Value<string>>;
    ClonePermissions?: Value<boolean>;
    ConfigurationManager?: StackConfigurationManager;
    CustomCookbooksSource?: Source;
    CustomJson?: any;
    DefaultAvailabilityZone?: Value<string>;
    DefaultInstanceProfileArn: Value<string>;
    DefaultOs?: Value<string>;
    DefaultRootDeviceType?: Value<string>;
    DefaultSshKeyName?: Value<string>;
    DefaultSubnetId?: Value<string>;
    EcsClusterArn?: Value<string>;
    ElasticIps?: List<ElasticIp>;
    HostnameTheme?: Value<string>;
    Name: Value<string>;
    RdsDbInstances?: List<RdsDbInstance>;
    ServiceRoleArn: Value<string>;
    SourceStackId?: Value<string>;
    Tags?: ResourceTag[];
    UseCustomCookbooks?: Value<boolean>;
    UseOpsworksSecurityGroups?: Value<boolean>;
    VpcId?: Value<string>;
}
export default class Stack extends ResourceBase {
    static Source: typeof Source;
    static ChefConfiguration: typeof ChefConfiguration;
    static StackConfigurationManager: typeof StackConfigurationManager;
    static RdsDbInstance: typeof RdsDbInstance;
    static ElasticIp: typeof ElasticIp;
    constructor(properties?: StackProperties);
}
