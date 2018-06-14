/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface ResolverProperties {
    ResponseMappingTemplateS3Location?: Value<string>
    TypeName: Value<string>
    DataSourceName: Value<string>
    RequestMappingTemplate?: Value<string>
    ResponseMappingTemplate?: Value<string>
    RequestMappingTemplateS3Location?: Value<string>
    ApiId: Value<string>
    FieldName: Value<string>
}

export default class Resolver extends ResourceBase {


    constructor(properties?: ResolverProperties) {
        super('AWS::AppSync::Resolver', properties)
    }
}
