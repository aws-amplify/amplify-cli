/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface GraphQLSchemaProperties {
    Definition?: Value<string>
    DefinitionS3Location?: Value<string>
    ApiId: Value<string>
}

export default class GraphQLSchema extends ResourceBase {


    constructor(properties?: GraphQLSchemaProperties) {
        super('AWS::AppSync::GraphQLSchema', properties)
    }
}
