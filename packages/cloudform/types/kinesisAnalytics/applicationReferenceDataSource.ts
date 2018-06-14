/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class S3ReferenceDataSource {
    BucketARN: Value<string>
    FileKey: Value<string>
    ReferenceRoleARN: Value<string>

    constructor(properties: S3ReferenceDataSource) {
        Object.assign(this, properties)
    }
}

export class MappingParameters {
    JSONMappingParameters?: JSONMappingParameters
    CSVMappingParameters?: CSVMappingParameters

    constructor(properties: MappingParameters) {
        Object.assign(this, properties)
    }
}

export class JSONMappingParameters {
    RecordRowPath: Value<string>

    constructor(properties: JSONMappingParameters) {
        Object.assign(this, properties)
    }
}

export class RecordFormat {
    MappingParameters?: MappingParameters
    RecordFormatType: Value<string>

    constructor(properties: RecordFormat) {
        Object.assign(this, properties)
    }
}

export class RecordColumn {
    Mapping?: Value<string>
    SqlType: Value<string>
    Name: Value<string>

    constructor(properties: RecordColumn) {
        Object.assign(this, properties)
    }
}

export class CSVMappingParameters {
    RecordRowDelimiter: Value<string>
    RecordColumnDelimiter: Value<string>

    constructor(properties: CSVMappingParameters) {
        Object.assign(this, properties)
    }
}

export class ReferenceSchema {
    RecordEncoding?: Value<string>
    RecordColumns: List<RecordColumn>
    RecordFormat: RecordFormat

    constructor(properties: ReferenceSchema) {
        Object.assign(this, properties)
    }
}

export class ReferenceDataSource {
    ReferenceSchema: ReferenceSchema
    TableName?: Value<string>
    S3ReferenceDataSource?: S3ReferenceDataSource

    constructor(properties: ReferenceDataSource) {
        Object.assign(this, properties)
    }
}

export interface ApplicationReferenceDataSourceProperties {
    ApplicationName: Value<string>
    ReferenceDataSource: ReferenceDataSource
}

export default class ApplicationReferenceDataSource extends ResourceBase {
    static S3ReferenceDataSource = S3ReferenceDataSource
    static MappingParameters = MappingParameters
    static JSONMappingParameters = JSONMappingParameters
    static RecordFormat = RecordFormat
    static RecordColumn = RecordColumn
    static CSVMappingParameters = CSVMappingParameters
    static ReferenceSchema = ReferenceSchema
    static ReferenceDataSource = ReferenceDataSource

    constructor(properties?: ApplicationReferenceDataSourceProperties) {
        super('AWS::KinesisAnalytics::ApplicationReferenceDataSource', properties)
    }
}
