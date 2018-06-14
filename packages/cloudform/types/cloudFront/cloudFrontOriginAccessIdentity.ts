/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class CloudFrontOriginAccessIdentityConfig {
    Comment: Value<string>

    constructor(properties: CloudFrontOriginAccessIdentityConfig) {
        Object.assign(this, properties)
    }
}

export interface CloudFrontOriginAccessIdentityProperties {
    CloudFrontOriginAccessIdentityConfig: CloudFrontOriginAccessIdentityConfig
}

export default class CloudFrontOriginAccessIdentity extends ResourceBase {
    static CloudFrontOriginAccessIdentityConfig = CloudFrontOriginAccessIdentityConfig

    constructor(properties?: CloudFrontOriginAccessIdentityProperties) {
        super('AWS::CloudFront::CloudFrontOriginAccessIdentity', properties)
    }
}
