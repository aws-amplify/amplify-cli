"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class SkewedInfo {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SkewedInfo = SkewedInfo;
class StorageDescriptor {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.StorageDescriptor = StorageDescriptor;
class TableInput {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.TableInput = TableInput;
class SerdeInfo {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SerdeInfo = SerdeInfo;
class Order {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Order = Order;
class Column {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Column = Column;
class Table extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::Glue::Table', properties);
    }
}
Table.SkewedInfo = SkewedInfo;
Table.StorageDescriptor = StorageDescriptor;
Table.TableInput = TableInput;
Table.SerdeInfo = SerdeInfo;
Table.Order = Order;
Table.Column = Column;
exports.default = Table;
