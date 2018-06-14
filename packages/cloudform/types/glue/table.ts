/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class SkewedInfo {
    SkewedColumnNames?: List<Value<string>>
    SkewedColumnValues?: List<Value<string>>
    SkewedColumnValueLocationMaps?: any

    constructor(properties: SkewedInfo) {
        Object.assign(this, properties)
    }
}

export class StorageDescriptor {
    StoredAsSubDirectories?: Value<boolean>
    Parameters?: any
    BucketColumns?: List<Value<string>>
    SkewedInfo?: SkewedInfo
    InputFormat?: Value<string>
    NumberOfBuckets?: Value<number>
    OutputFormat?: Value<string>
    Columns?: List<Column>
    SerdeInfo?: SerdeInfo
    SortColumns?: List<Order>
    Compressed?: Value<boolean>
    Location?: Value<string>

    constructor(properties: StorageDescriptor) {
        Object.assign(this, properties)
    }
}

export class TableInput {
    Owner?: Value<string>
    ViewOriginalText?: Value<string>
    Description?: Value<string>
    TableType?: Value<string>
    Parameters?: any
    ViewExpandedText?: Value<string>
    StorageDescriptor?: StorageDescriptor
    PartitionKeys?: List<Column>
    Retention?: Value<number>
    Name?: Value<string>

    constructor(properties: TableInput) {
        Object.assign(this, properties)
    }
}

export class SerdeInfo {
    Parameters?: any
    SerializationLibrary?: Value<string>
    Name?: Value<string>

    constructor(properties: SerdeInfo) {
        Object.assign(this, properties)
    }
}

export class Order {
    Column: Value<string>
    SortOrder: Value<number>

    constructor(properties: Order) {
        Object.assign(this, properties)
    }
}

export class Column {
    Comment?: Value<string>
    Type?: Value<string>
    Name: Value<string>

    constructor(properties: Column) {
        Object.assign(this, properties)
    }
}

export interface TableProperties {
    TableInput: TableInput
    DatabaseName: Value<string>
    CatalogId: Value<string>
}

export default class Table extends ResourceBase {
    static SkewedInfo = SkewedInfo
    static StorageDescriptor = StorageDescriptor
    static TableInput = TableInput
    static SerdeInfo = SerdeInfo
    static Order = Order
    static Column = Column

    constructor(properties?: TableProperties) {
        super('AWS::Glue::Table', properties)
    }
}
