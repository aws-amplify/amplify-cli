/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface SubnetRouteTableAssociationProperties {
    RouteTableId: Value<string>
    SubnetId: Value<string>
}

export default class SubnetRouteTableAssociation extends ResourceBase {


    constructor(properties?: SubnetRouteTableAssociationProperties) {
        super('AWS::EC2::SubnetRouteTableAssociation', properties)
    }
}
