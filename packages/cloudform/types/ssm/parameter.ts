/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface ParameterProperties {
    Type: Value<string>
    Description?: Value<string>
    AllowedPattern?: Value<string>
    Value: Value<string>
    Name?: Value<string>
}

export default class Parameter extends ResourceBase {


    constructor(properties?: ParameterProperties) {
        super('AWS::SSM::Parameter', properties)
    }
}
