"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class EventDestination {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.EventDestination = EventDestination;
class CloudWatchDestination {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.CloudWatchDestination = CloudWatchDestination;
class KinesisFirehoseDestination {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.KinesisFirehoseDestination = KinesisFirehoseDestination;
class DimensionConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.DimensionConfiguration = DimensionConfiguration;
class ConfigurationSetEventDestination extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::SES::ConfigurationSetEventDestination', properties);
    }
}
ConfigurationSetEventDestination.EventDestination = EventDestination;
ConfigurationSetEventDestination.CloudWatchDestination = CloudWatchDestination;
ConfigurationSetEventDestination.KinesisFirehoseDestination = KinesisFirehoseDestination;
ConfigurationSetEventDestination.DimensionConfiguration = DimensionConfiguration;
exports.default = ConfigurationSetEventDestination;
