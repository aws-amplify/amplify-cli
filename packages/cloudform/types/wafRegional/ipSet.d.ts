import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class IPSetDescriptor {
    Type: Value<string>;
    Value: Value<string>;
    constructor(properties: IPSetDescriptor);
}
export interface IPSetProperties {
    IPSetDescriptors?: List<IPSetDescriptor>;
    Name: Value<string>;
}
export default class IPSet extends ResourceBase {
    static IPSetDescriptor: typeof IPSetDescriptor;
    constructor(properties?: IPSetProperties);
}
