/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface DashboardProperties {
    DashboardName?: Value<string>
    DashboardBody: Value<string>
}

export default class Dashboard extends ResourceBase {


    constructor(properties?: DashboardProperties) {
        super('AWS::CloudWatch::Dashboard', properties)
    }
}
