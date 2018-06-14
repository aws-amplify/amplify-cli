/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface CustomResourceProperties {
    ServiceToken: Value<string>
}

export default class CustomResource extends ResourceBase {


    constructor(properties?: CustomResourceProperties) {
        super('AWS::CloudFormation::CustomResource', properties)
    }
}
