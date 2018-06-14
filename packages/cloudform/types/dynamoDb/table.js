"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class TimeToLiveSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.TimeToLiveSpecification = TimeToLiveSpecification;
class AttributeDefinition {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.AttributeDefinition = AttributeDefinition;
class LocalSecondaryIndex {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.LocalSecondaryIndex = LocalSecondaryIndex;
class ProvisionedThroughput {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ProvisionedThroughput = ProvisionedThroughput;
class GlobalSecondaryIndex {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.GlobalSecondaryIndex = GlobalSecondaryIndex;
class KeySchema {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.KeySchema = KeySchema;
class Projection {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Projection = Projection;
class SSESpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SSESpecification = SSESpecification;
class StreamSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.StreamSpecification = StreamSpecification;
class Table extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::DynamoDB::Table', properties);
    }
}
Table.TimeToLiveSpecification = TimeToLiveSpecification;
Table.AttributeDefinition = AttributeDefinition;
Table.LocalSecondaryIndex = LocalSecondaryIndex;
Table.ProvisionedThroughput = ProvisionedThroughput;
Table.GlobalSecondaryIndex = GlobalSecondaryIndex;
Table.KeySchema = KeySchema;
Table.Projection = Projection;
Table.SSESpecification = SSESpecification;
Table.StreamSpecification = StreamSpecification;
exports.default = Table;
