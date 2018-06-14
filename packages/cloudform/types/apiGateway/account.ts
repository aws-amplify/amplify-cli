/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface AccountProperties {
    CloudWatchRoleArn?: Value<string>
}

export default class Account extends ResourceBase {


    constructor(properties?: AccountProperties) {
        super('AWS::ApiGateway::Account', properties)
    }
}
