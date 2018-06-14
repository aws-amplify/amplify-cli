import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class OptionSetting {
    Name?: Value<string>;
    Value?: Value<string>;
    constructor(properties: OptionSetting);
}
export declare class OptionConfiguration {
    DBSecurityGroupMemberships?: List<Value<string>>;
    OptionName: Value<string>;
    OptionSettings?: OptionSetting;
    OptionVersion?: Value<string>;
    Port?: Value<number>;
    VpcSecurityGroupMemberships?: List<Value<string>>;
    constructor(properties: OptionConfiguration);
}
export interface OptionGroupProperties {
    EngineName: Value<string>;
    MajorEngineVersion: Value<string>;
    OptionConfigurations: List<OptionConfiguration>;
    OptionGroupDescription: Value<string>;
    Tags?: ResourceTag[];
}
export default class OptionGroup extends ResourceBase {
    static OptionSetting: typeof OptionSetting;
    static OptionConfiguration: typeof OptionConfiguration;
    constructor(properties?: OptionGroupProperties);
}
