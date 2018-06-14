/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface SubnetCidrBlockProperties {
    Ipv6CidrBlock: Value<string>
    SubnetId: Value<string>
}

export default class SubnetCidrBlock extends ResourceBase {


    constructor(properties?: SubnetCidrBlockProperties) {
        super('AWS::EC2::SubnetCidrBlock', properties)
    }
}
