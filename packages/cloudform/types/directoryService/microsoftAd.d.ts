import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class VpcSettings {
    SubnetIds: List<Value<string>>;
    VpcId: Value<string>;
    constructor(properties: VpcSettings);
}
export interface MicrosoftADProperties {
    CreateAlias?: Value<boolean>;
    EnableSso?: Value<boolean>;
    Name: Value<string>;
    Password: Value<string>;
    ShortName?: Value<string>;
    VpcSettings: VpcSettings;
}
export default class MicrosoftAD extends ResourceBase {
    static VpcSettings: typeof VpcSettings;
    constructor(properties?: MicrosoftADProperties);
}
