/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface DomainProperties {
    Description?: Value<string>
}

export default class Domain extends ResourceBase {


    constructor(properties?: DomainProperties) {
        super('AWS::SDB::Domain', properties)
    }
}
