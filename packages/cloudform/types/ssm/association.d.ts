import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class InstanceAssociationOutputLocation {
    S3Location?: S3OutputLocation;
    constructor(properties: InstanceAssociationOutputLocation);
}
export declare class Target {
    Key: Value<string>;
    Values: List<Value<string>>;
    constructor(properties: Target);
}
export declare class ParameterValues {
    ParameterValues: List<Value<string>>;
    constructor(properties: ParameterValues);
}
export declare class S3OutputLocation {
    OutputS3BucketName?: Value<string>;
    OutputS3KeyPrefix?: Value<string>;
    constructor(properties: S3OutputLocation);
}
export interface AssociationProperties {
    AssociationName?: Value<string>;
    DocumentVersion?: Value<string>;
    InstanceId?: Value<string>;
    Name: Value<string>;
    OutputLocation?: InstanceAssociationOutputLocation;
    Parameters?: {
        [key: string]: ParameterValues;
    };
    ScheduleExpression?: Value<string>;
    Targets?: List<Target>;
}
export default class Association extends ResourceBase {
    static InstanceAssociationOutputLocation: typeof InstanceAssociationOutputLocation;
    static Target: typeof Target;
    static ParameterValues: typeof ParameterValues;
    static S3OutputLocation: typeof S3OutputLocation;
    constructor(properties?: AssociationProperties);
}
