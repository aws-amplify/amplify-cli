/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface NamedQueryProperties {
    Description?: Value<string>
    QueryString: Value<string>
    Database: Value<string>
    Name?: Value<string>
}

export default class NamedQuery extends ResourceBase {


    constructor(properties?: NamedQueryProperties) {
        super('AWS::Athena::NamedQuery', properties)
    }
}
