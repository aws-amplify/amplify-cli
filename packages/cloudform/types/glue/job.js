"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class JobCommand {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.JobCommand = JobCommand;
class ConnectionsList {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ConnectionsList = ConnectionsList;
class ExecutionProperty {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ExecutionProperty = ExecutionProperty;
class Job extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::Glue::Job', properties);
    }
}
Job.JobCommand = JobCommand;
Job.ConnectionsList = ConnectionsList;
Job.ExecutionProperty = ExecutionProperty;
exports.default = Job;
