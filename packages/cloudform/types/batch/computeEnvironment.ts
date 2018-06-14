/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class ComputeResources {
    SpotIamFleetRole?: Value<string>
    MaxvCpus: Value<number>
    BidPercentage?: Value<number>
    SecurityGroupIds: List<Value<string>>
    Subnets: List<Value<string>>
    Type: Value<string>
    MinvCpus: Value<number>
    ImageId?: Value<string>
    InstanceRole: Value<string>
    InstanceTypes: List<Value<string>>
    Ec2KeyPair?: Value<string>
    Tags?: ResourceTag[]
    DesiredvCpus?: Value<number>

    constructor(properties: ComputeResources) {
        Object.assign(this, properties)
    }
}

export interface ComputeEnvironmentProperties {
    Type: Value<string>
    ServiceRole: Value<string>
    ComputeEnvironmentName?: Value<string>
    ComputeResources?: ComputeResources
    State?: Value<string>
}

export default class ComputeEnvironment extends ResourceBase {
    static ComputeResources = ComputeResources

    constructor(properties?: ComputeEnvironmentProperties) {
        super('AWS::Batch::ComputeEnvironment', properties)
    }
}
