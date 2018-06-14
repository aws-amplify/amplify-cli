/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class S3Location {
    Bucket: Value<string>
    Key: Value<string>
    RoleArn: Value<string>

    constructor(properties: S3Location) {
        Object.assign(this, properties)
    }
}

export interface BuildProperties {
    Name?: Value<string>
    StorageLocation?: S3Location
    Version?: Value<string>
}

export default class Build extends ResourceBase {
    static S3Location = S3Location

    constructor(properties?: BuildProperties) {
        super('AWS::GameLift::Build', properties)
    }
}
