/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class TemplateInner {
    HtmlPart?: Value<string>
    TextPart?: Value<string>
    TemplateName?: Value<string>
    SubjectPart?: Value<string>

    constructor(properties: TemplateInner) {
        Object.assign(this, properties)
    }
}

export interface TemplateProperties {
    Template?: Template
}

export default class Template extends ResourceBase {
    static Template = TemplateInner

    constructor(properties?: TemplateProperties) {
        super('AWS::SES::Template', properties)
    }
}
