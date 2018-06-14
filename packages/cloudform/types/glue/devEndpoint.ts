/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface DevEndpointProperties {
    ExtraJarsS3Path?: Value<string>
    EndpointName?: Value<string>
    PublicKey: Value<string>
    NumberOfNodes?: Value<number>
    SubnetId?: Value<string>
    ExtraPythonLibsS3Path?: Value<string>
    SecurityGroupIds?: List<Value<string>>
    RoleArn: Value<string>
}

export default class DevEndpoint extends ResourceBase {


    constructor(properties?: DevEndpointProperties) {
        super('AWS::Glue::DevEndpoint', properties)
    }
}
