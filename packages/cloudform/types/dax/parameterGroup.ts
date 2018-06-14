/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface ParameterGroupProperties {
    ParameterNameValues?: any
    Description?: Value<string>
    ParameterGroupName?: Value<string>
}

export default class ParameterGroup extends ResourceBase {


    constructor(properties?: ParameterGroupProperties) {
        super('AWS::DAX::ParameterGroup', properties)
    }
}
