"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class GrokClassifier {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.GrokClassifier = GrokClassifier;
class Classifier extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::Glue::Classifier', properties);
    }
}
Classifier.GrokClassifier = GrokClassifier;
exports.default = Classifier;
