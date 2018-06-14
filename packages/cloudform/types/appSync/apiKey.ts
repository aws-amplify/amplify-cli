/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface ApiKeyProperties {
    Description?: Value<string>
    Expires?: Value<number>
    ApiId: Value<string>
}

export default class ApiKey extends ResourceBase {


    constructor(properties?: ApiKeyProperties) {
        super('AWS::AppSync::ApiKey', properties)
    }
}
