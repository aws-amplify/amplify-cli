/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface VPCDHCPOptionsAssociationProperties {
    DhcpOptionsId: Value<string>
    VpcId: Value<string>
}

export default class VPCDHCPOptionsAssociation extends ResourceBase {


    constructor(properties?: VPCDHCPOptionsAssociationProperties) {
        super('AWS::EC2::VPCDHCPOptionsAssociation', properties)
    }
}
