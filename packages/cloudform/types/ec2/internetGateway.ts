/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface InternetGatewayProperties {
    Tags?: ResourceTag[]
}

export default class InternetGateway extends ResourceBase {


    constructor(properties?: InternetGatewayProperties) {
        super('AWS::EC2::InternetGateway', properties)
    }
}
