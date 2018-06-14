/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface RouteTableProperties {
    Tags?: ResourceTag[]
    VpcId: Value<string>
}

export default class RouteTable extends ResourceBase {


    constructor(properties?: RouteTableProperties) {
        super('AWS::EC2::RouteTable', properties)
    }
}
