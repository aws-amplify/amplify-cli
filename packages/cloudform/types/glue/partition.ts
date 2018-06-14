/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class SerdeInfo {
    Parameters?: any
    SerializationLibrary?: Value<string>
    Name?: Value<string>

    constructor(properties: SerdeInfo) {
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

export class Order {
    Column: Value<string>
    SortOrder?: Value<number>

    constructor(properties: Order) {
        Object.assign(this, properties)
    }
}

export class SkewedInfo {
    SkewedColumnNames?: List<Value<string>>
    SkewedColumnValues?: List<Value<string>>
    SkewedColumnValueLocationMaps?: any

    constructor(properties: SkewedInfo) {
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

export class PartitionInput {
    Parameters?: any
    StorageDescriptor?: StorageDescriptor
    Values: List<Value<string>>

    constructor(properties: PartitionInput) {
        Object.assign(this, properties)
    }
}

export interface PartitionProperties {
    TableName: Value<string>
    DatabaseName: Value<string>
    CatalogId: Value<string>
    PartitionInput: PartitionInput
}

export default class Partition extends ResourceBase {
    static SerdeInfo = SerdeInfo
    static StorageDescriptor = StorageDescriptor
    static Order = Order
    static SkewedInfo = SkewedInfo
    static Column = Column
    static PartitionInput = PartitionInput

    constructor(properties?: PartitionProperties) {
        super('AWS::Glue::Partition', properties)
    }
}
