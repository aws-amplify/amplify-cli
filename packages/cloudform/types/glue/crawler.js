"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class Targets {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Targets = Targets;
class JdbcTarget {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.JdbcTarget = JdbcTarget;
class Schedule {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Schedule = Schedule;
class S3Target {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.S3Target = S3Target;
class SchemaChangePolicy {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SchemaChangePolicy = SchemaChangePolicy;
class Crawler extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::Glue::Crawler', properties);
    }
}
Crawler.Targets = Targets;
Crawler.JdbcTarget = JdbcTarget;
Crawler.Schedule = Schedule;
Crawler.S3Target = S3Target;
Crawler.SchemaChangePolicy = SchemaChangePolicy;
exports.default = Crawler;
