import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class SerdeInfo {
    Parameters?: any;
    SerializationLibrary?: Value<string>;
    Name?: Value<string>;
    constructor(properties: SerdeInfo);
}
export declare class StorageDescriptor {
    StoredAsSubDirectories?: Value<boolean>;
    Parameters?: any;
    BucketColumns?: List<Value<string>>;
    SkewedInfo?: SkewedInfo;
    InputFormat?: Value<string>;
    NumberOfBuckets?: Value<number>;
    OutputFormat?: Value<string>;
    Columns?: List<Column>;
    SerdeInfo?: SerdeInfo;
    SortColumns?: List<Order>;
    Compressed?: Value<boolean>;
    Location?: Value<string>;
    constructor(properties: StorageDescriptor);
}
export declare class Order {
    Column: Value<string>;
    SortOrder?: Value<number>;
    constructor(properties: Order);
}
export declare class SkewedInfo {
    SkewedColumnNames?: List<Value<string>>;
    SkewedColumnValues?: List<Value<string>>;
    SkewedColumnValueLocationMaps?: any;
    constructor(properties: SkewedInfo);
}
export declare class Column {
    Comment?: Value<string>;
    Type?: Value<string>;
    Name: Value<string>;
    constructor(properties: Column);
}
export declare class PartitionInput {
    Parameters?: any;
    StorageDescriptor?: StorageDescriptor;
    Values: List<Value<string>>;
    constructor(properties: PartitionInput);
}
export interface PartitionProperties {
    TableName: Value<string>;
    DatabaseName: Value<string>;
    CatalogId: Value<string>;
    PartitionInput: PartitionInput;
}
export default class Partition extends ResourceBase {
    static SerdeInfo: typeof SerdeInfo;
    static StorageDescriptor: typeof StorageDescriptor;
    static Order: typeof Order;
    static SkewedInfo: typeof SkewedInfo;
    static Column: typeof Column;
    static PartitionInput: typeof PartitionInput;
    constructor(properties?: PartitionProperties);
}
