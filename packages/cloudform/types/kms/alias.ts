/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface AliasProperties {
    AliasName: Value<string>
    TargetKeyId: Value<string>
}

export default class Alias extends ResourceBase {


    constructor(properties?: AliasProperties) {
        super('AWS::KMS::Alias', properties)
    }
}
