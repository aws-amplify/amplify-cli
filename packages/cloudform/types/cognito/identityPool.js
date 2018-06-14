"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class PushSync {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.PushSync = PushSync;
class CognitoIdentityProvider {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.CognitoIdentityProvider = CognitoIdentityProvider;
class CognitoStreams {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.CognitoStreams = CognitoStreams;
class IdentityPool extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::Cognito::IdentityPool', properties);
    }
}
IdentityPool.PushSync = PushSync;
IdentityPool.CognitoIdentityProvider = CognitoIdentityProvider;
IdentityPool.CognitoStreams = CognitoStreams;
exports.default = IdentityPool;
