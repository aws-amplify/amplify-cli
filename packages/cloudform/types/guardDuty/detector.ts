/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface DetectorProperties {
    Enable: Value<boolean>
}

export default class Detector extends ResourceBase {


    constructor(properties?: DetectorProperties) {
        super('AWS::GuardDuty::Detector', properties)
    }
}
