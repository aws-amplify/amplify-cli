/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface ResourceProperties {
    ParentId: Value<string>
    PathPart: Value<string>
    RestApiId: Value<string>
}

export default class Resource extends ResourceBase {


    constructor(properties?: ResourceProperties) {
        super('AWS::ApiGateway::Resource', properties)
    }
}
