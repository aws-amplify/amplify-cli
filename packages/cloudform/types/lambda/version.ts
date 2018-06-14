/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface VersionProperties {
    CodeSha256?: Value<string>
    Description?: Value<string>
    FunctionName: Value<string>
}

export default class Version extends ResourceBase {


    constructor(properties?: VersionProperties) {
        super('AWS::Lambda::Version', properties)
    }
}
