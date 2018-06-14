import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class ParameterAttribute {
    Key: Value<string>;
    StringValue: Value<string>;
    constructor(properties: ParameterAttribute);
}
export declare class PipelineTag {
    Key: Value<string>;
    Value: Value<string>;
    constructor(properties: PipelineTag);
}
export declare class ParameterObject {
    Attributes: List<ParameterAttribute>;
    Id: Value<string>;
    constructor(properties: ParameterObject);
}
export declare class PipelineObject {
    Fields: List<Field>;
    Id: Value<string>;
    Name: Value<string>;
    constructor(properties: PipelineObject);
}
export declare class ParameterValue {
    Id: Value<string>;
    StringValue: Value<string>;
    constructor(properties: ParameterValue);
}
export declare class Field {
    Key: Value<string>;
    RefValue?: Value<string>;
    StringValue?: Value<string>;
    constructor(properties: Field);
}
export interface PipelineProperties {
    Activate?: Value<boolean>;
    Description?: Value<string>;
    Name: Value<string>;
    ParameterObjects: List<ParameterObject>;
    ParameterValues?: List<ParameterValue>;
    PipelineObjects?: List<PipelineObject>;
    PipelineTags?: List<PipelineTag>;
}
export default class Pipeline extends ResourceBase {
    static ParameterAttribute: typeof ParameterAttribute;
    static PipelineTag: typeof PipelineTag;
    static ParameterObject: typeof ParameterObject;
    static PipelineObject: typeof PipelineObject;
    static ParameterValue: typeof ParameterValue;
    static Field: typeof Field;
    constructor(properties?: PipelineProperties);
}
