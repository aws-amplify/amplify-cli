/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface ActivityProperties {
    Name: Value<string>
}

export default class Activity extends ResourceBase {


    constructor(properties?: ActivityProperties) {
        super('AWS::StepFunctions::Activity', properties)
    }
}
