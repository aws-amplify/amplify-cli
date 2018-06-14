/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class ParameterAttribute {
    Key: Value<string>
    StringValue: Value<string>

    constructor(properties: ParameterAttribute) {
        Object.assign(this, properties)
    }
}

export class PipelineTag {
    Key: Value<string>
    Value: Value<string>

    constructor(properties: PipelineTag) {
        Object.assign(this, properties)
    }
}

export class ParameterObject {
    Attributes: List<ParameterAttribute>
    Id: Value<string>

    constructor(properties: ParameterObject) {
        Object.assign(this, properties)
    }
}

export class PipelineObject {
    Fields: List<Field>
    Id: Value<string>
    Name: Value<string>

    constructor(properties: PipelineObject) {
        Object.assign(this, properties)
    }
}

export class ParameterValue {
    Id: Value<string>
    StringValue: Value<string>

    constructor(properties: ParameterValue) {
        Object.assign(this, properties)
    }
}

export class Field {
    Key: Value<string>
    RefValue?: Value<string>
    StringValue?: Value<string>

    constructor(properties: Field) {
        Object.assign(this, properties)
    }
}

export interface PipelineProperties {
    Activate?: Value<boolean>
    Description?: Value<string>
    Name: Value<string>
    ParameterObjects: List<ParameterObject>
    ParameterValues?: List<ParameterValue>
    PipelineObjects?: List<PipelineObject>
    PipelineTags?: List<PipelineTag>
}

export default class Pipeline extends ResourceBase {
    static ParameterAttribute = ParameterAttribute
    static PipelineTag = PipelineTag
    static ParameterObject = ParameterObject
    static PipelineObject = PipelineObject
    static ParameterValue = ParameterValue
    static Field = Field

    constructor(properties?: PipelineProperties) {
        super('AWS::DataPipeline::Pipeline', properties)
    }
}
