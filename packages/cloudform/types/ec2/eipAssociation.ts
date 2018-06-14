/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface EIPAssociationProperties {
    AllocationId?: Value<string>
    EIP?: Value<string>
    InstanceId?: Value<string>
    NetworkInterfaceId?: Value<string>
    PrivateIpAddress?: Value<string>
}

export default class EIPAssociation extends ResourceBase {


    constructor(properties?: EIPAssociationProperties) {
        super('AWS::EC2::EIPAssociation', properties)
    }
}
