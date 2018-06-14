/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class IPSetDescriptor {
    Type: Value<string>
    Value: Value<string>

    constructor(properties: IPSetDescriptor) {
        Object.assign(this, properties)
    }
}

export interface IPSetProperties {
    IPSetDescriptors?: List<IPSetDescriptor>
    Name: Value<string>
}

export default class IPSet extends ResourceBase {
    static IPSetDescriptor = IPSetDescriptor

    constructor(properties?: IPSetProperties) {
        super('AWS::WAFRegional::IPSet', properties)
    }
}
