/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface AssessmentTargetProperties {
    AssessmentTargetName?: Value<string>
    ResourceGroupArn: Value<string>
}

export default class AssessmentTarget extends ResourceBase {


    constructor(properties?: AssessmentTargetProperties) {
        super('AWS::Inspector::AssessmentTarget', properties)
    }
}
