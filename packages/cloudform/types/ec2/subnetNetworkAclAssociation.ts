/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface SubnetNetworkAclAssociationProperties {
    NetworkAclId: Value<string>
    SubnetId: Value<string>
}

export default class SubnetNetworkAclAssociation extends ResourceBase {


    constructor(properties?: SubnetNetworkAclAssociationProperties) {
        super('AWS::EC2::SubnetNetworkAclAssociation', properties)
    }
}
