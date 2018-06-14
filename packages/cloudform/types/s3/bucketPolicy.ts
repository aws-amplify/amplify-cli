/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface BucketPolicyProperties {
    Bucket: Value<string>
    PolicyDocument: any
}

export default class BucketPolicy extends ResourceBase {


    constructor(properties?: BucketPolicyProperties) {
        super('AWS::S3::BucketPolicy', properties)
    }
}
