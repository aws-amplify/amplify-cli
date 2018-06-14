import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class S3ReferenceDataSource {
    BucketARN: Value<string>;
    FileKey: Value<string>;
    ReferenceRoleARN: Value<string>;
    constructor(properties: S3ReferenceDataSource);
}
export declare class MappingParameters {
    JSONMappingParameters?: JSONMappingParameters;
    CSVMappingParameters?: CSVMappingParameters;
    constructor(properties: MappingParameters);
}
export declare class JSONMappingParameters {
    RecordRowPath: Value<string>;
    constructor(properties: JSONMappingParameters);
}
export declare class RecordFormat {
    MappingParameters?: MappingParameters;
    RecordFormatType: Value<string>;
    constructor(properties: RecordFormat);
}
export declare class RecordColumn {
    Mapping?: Value<string>;
    SqlType: Value<string>;
    Name: Value<string>;
    constructor(properties: RecordColumn);
}
export declare class CSVMappingParameters {
    RecordRowDelimiter: Value<string>;
    RecordColumnDelimiter: Value<string>;
    constructor(properties: CSVMappingParameters);
}
export declare class ReferenceSchema {
    RecordEncoding?: Value<string>;
    RecordColumns: List<RecordColumn>;
    RecordFormat: RecordFormat;
    constructor(properties: ReferenceSchema);
}
export declare class ReferenceDataSource {
    ReferenceSchema: ReferenceSchema;
    TableName?: Value<string>;
    S3ReferenceDataSource?: S3ReferenceDataSource;
    constructor(properties: ReferenceDataSource);
}
export interface ApplicationReferenceDataSourceProperties {
    ApplicationName: Value<string>;
    ReferenceDataSource: ReferenceDataSource;
}
export default class ApplicationReferenceDataSource extends ResourceBase {
    static S3ReferenceDataSource: typeof S3ReferenceDataSource;
    static MappingParameters: typeof MappingParameters;
    static JSONMappingParameters: typeof JSONMappingParameters;
    static RecordFormat: typeof RecordFormat;
    static RecordColumn: typeof RecordColumn;
    static CSVMappingParameters: typeof CSVMappingParameters;
    static ReferenceSchema: typeof ReferenceSchema;
    static ReferenceDataSource: typeof ReferenceDataSource;
    constructor(properties?: ApplicationReferenceDataSourceProperties);
}
