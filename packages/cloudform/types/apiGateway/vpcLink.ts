/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface VpcLinkProperties {
    Description?: Value<string>
    TargetArns: List<Value<string>>
    Name: Value<string>
}

export default class VpcLink extends ResourceBase {


    constructor(properties?: VpcLinkProperties) {
        super('AWS::ApiGateway::VpcLink', properties)
    }
}
