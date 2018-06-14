/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class LoadBalancerAttribute {
    Key?: Value<string>
    Value?: Value<string>

    constructor(properties: LoadBalancerAttribute) {
        Object.assign(this, properties)
    }
}

export class SubnetMapping {
    AllocationId: Value<string>
    SubnetId: Value<string>

    constructor(properties: SubnetMapping) {
        Object.assign(this, properties)
    }
}

export interface LoadBalancerProperties {
    IpAddressType?: Value<string>
    LoadBalancerAttributes?: List<LoadBalancerAttribute>
    Name?: Value<string>
    Scheme?: Value<string>
    SecurityGroups?: List<Value<string>>
    SubnetMappings?: List<SubnetMapping>
    Subnets?: List<Value<string>>
    Tags?: ResourceTag[]
    Type?: Value<string>
}

export default class LoadBalancer extends ResourceBase {
    static LoadBalancerAttribute = LoadBalancerAttribute
    static SubnetMapping = SubnetMapping

    constructor(properties?: LoadBalancerProperties) {
        super('AWS::ElasticLoadBalancingV2::LoadBalancer', properties)
    }
}
