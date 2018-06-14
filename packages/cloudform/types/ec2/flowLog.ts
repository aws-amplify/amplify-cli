/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface FlowLogProperties {
    DeliverLogsPermissionArn: Value<string>
    LogGroupName: Value<string>
    ResourceId: Value<string>
    ResourceType: Value<string>
    TrafficType: Value<string>
}

export default class FlowLog extends ResourceBase {


    constructor(properties?: FlowLogProperties) {
        super('AWS::EC2::FlowLog', properties)
    }
}
