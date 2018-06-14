/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface BasePathMappingProperties {
    BasePath?: Value<string>
    DomainName: Value<string>
    RestApiId?: Value<string>
    Stage?: Value<string>
}

export default class BasePathMapping extends ResourceBase {


    constructor(properties?: BasePathMappingProperties) {
        super('AWS::ApiGateway::BasePathMapping', properties)
    }
}
