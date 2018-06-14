/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class MinimumHealthyHosts {
    Type: Value<string>
    Value: Value<number>

    constructor(properties: MinimumHealthyHosts) {
        Object.assign(this, properties)
    }
}

export interface DeploymentConfigProperties {
    DeploymentConfigName?: Value<string>
    MinimumHealthyHosts?: MinimumHealthyHosts
}

export default class DeploymentConfig extends ResourceBase {
    static MinimumHealthyHosts = MinimumHealthyHosts

    constructor(properties?: DeploymentConfigProperties) {
        super('AWS::CodeDeploy::DeploymentConfig', properties)
    }
}
