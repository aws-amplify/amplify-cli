"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class SerdeInfo {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SerdeInfo = SerdeInfo;
class StorageDescriptor {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.StorageDescriptor = StorageDescriptor;
class Order {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Order = Order;
class SkewedInfo {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SkewedInfo = SkewedInfo;
class Column {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Column = Column;
class PartitionInput {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.PartitionInput = PartitionInput;
class Partition extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::Glue::Partition', properties);
    }
}
Partition.SerdeInfo = SerdeInfo;
Partition.StorageDescriptor = StorageDescriptor;
Partition.Order = Order;
Partition.SkewedInfo = SkewedInfo;
Partition.Column = Column;
Partition.PartitionInput = PartitionInput;
exports.default = Partition;
