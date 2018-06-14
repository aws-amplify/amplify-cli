/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface TagOptionProperties {
    Active?: Value<boolean>
    Value: Value<string>
    Key: Value<string>
}

export default class TagOption extends ResourceBase {


    constructor(properties?: TagOptionProperties) {
        super('AWS::ServiceCatalog::TagOption', properties)
    }
}
