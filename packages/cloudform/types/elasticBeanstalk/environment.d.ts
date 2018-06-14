import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class OptionSetting {
    Namespace: Value<string>;
    OptionName: Value<string>;
    ResourceName?: Value<string>;
    Value?: Value<string>;
    constructor(properties: OptionSetting);
}
export declare class Tier {
    Name?: Value<string>;
    Type?: Value<string>;
    Version?: Value<string>;
    constructor(properties: Tier);
}
export interface EnvironmentProperties {
    ApplicationName: Value<string>;
    CNAMEPrefix?: Value<string>;
    Description?: Value<string>;
    EnvironmentName?: Value<string>;
    OptionSettings?: List<OptionSetting>;
    PlatformArn?: Value<string>;
    SolutionStackName?: Value<string>;
    Tags?: ResourceTag[];
    TemplateName?: Value<string>;
    Tier?: Tier;
    VersionLabel?: Value<string>;
}
export default class Environment extends ResourceBase {
    static OptionSetting: typeof OptionSetting;
    static Tier: typeof Tier;
    constructor(properties?: EnvironmentProperties);
}
