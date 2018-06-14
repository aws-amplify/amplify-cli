/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class SourceBundle {
    S3Bucket: Value<string>
    S3Key: Value<string>

    constructor(properties: SourceBundle) {
        Object.assign(this, properties)
    }
}

export interface ApplicationVersionProperties {
    ApplicationName: Value<string>
    Description?: Value<string>
    SourceBundle: SourceBundle
}

export default class ApplicationVersion extends ResourceBase {
    static SourceBundle = SourceBundle

    constructor(properties?: ApplicationVersionProperties) {
        super('AWS::ElasticBeanstalk::ApplicationVersion', properties)
    }
}
