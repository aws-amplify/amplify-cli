/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface SecurityConfigurationProperties {
    Name?: Value<string>
    SecurityConfiguration: any
}

export default class SecurityConfiguration extends ResourceBase {


    constructor(properties?: SecurityConfigurationProperties) {
        super('AWS::EMR::SecurityConfiguration', properties)
    }
}
