import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class ComputeResources {
    SpotIamFleetRole?: Value<string>;
    MaxvCpus: Value<number>;
    BidPercentage?: Value<number>;
    SecurityGroupIds: List<Value<string>>;
    Subnets: List<Value<string>>;
    Type: Value<string>;
    MinvCpus: Value<number>;
    ImageId?: Value<string>;
    InstanceRole: Value<string>;
    InstanceTypes: List<Value<string>>;
    Ec2KeyPair?: Value<string>;
    Tags?: ResourceTag[];
    DesiredvCpus?: Value<number>;
    constructor(properties: ComputeResources);
}
export interface ComputeEnvironmentProperties {
    Type: Value<string>;
    ServiceRole: Value<string>;
    ComputeEnvironmentName?: Value<string>;
    ComputeResources?: ComputeResources;
    State?: Value<string>;
}
export default class ComputeEnvironment extends ResourceBase {
    static ComputeResources: typeof ComputeResources;
    constructor(properties?: ComputeEnvironmentProperties);
}
