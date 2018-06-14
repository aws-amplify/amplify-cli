"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class ProvisioningArtifactProperties {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ProvisioningArtifactProperties = ProvisioningArtifactProperties;
class CloudFormationProduct extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::ServiceCatalog::CloudFormationProduct', properties);
    }
}
CloudFormationProduct.ProvisioningArtifactProperties = ProvisioningArtifactProperties;
exports.default = CloudFormationProduct;
