/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface AssessmentTemplateProperties {
    AssessmentTargetArn: Value<string>
    DurationInSeconds: Value<number>
    AssessmentTemplateName?: Value<string>
    RulesPackageArns: List<Value<string>>
    UserAttributesForFindings?: List<ResourceTag>
}

export default class AssessmentTemplate extends ResourceBase {


    constructor(properties?: AssessmentTemplateProperties) {
        super('AWS::Inspector::AssessmentTemplate', properties)
    }
}
