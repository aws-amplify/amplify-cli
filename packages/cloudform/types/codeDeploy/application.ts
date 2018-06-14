/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface ApplicationProperties {
    ApplicationName?: Value<string>
    ComputePlatform?: Value<string>
}

export default class Application extends ResourceBase {


    constructor(properties?: ApplicationProperties) {
        super('AWS::CodeDeploy::Application', properties)
    }
}
