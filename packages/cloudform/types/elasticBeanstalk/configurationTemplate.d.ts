import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class SourceConfiguration {
    ApplicationName: Value<string>;
    TemplateName: Value<string>;
    constructor(properties: SourceConfiguration);
}
export declare class ConfigurationOptionSetting {
    Namespace: Value<string>;
    OptionName: Value<string>;
    ResourceName?: Value<string>;
    Value?: Value<string>;
    constructor(properties: ConfigurationOptionSetting);
}
export interface ConfigurationTemplateProperties {
    ApplicationName: Value<string>;
    Description?: Value<string>;
    EnvironmentId?: Value<string>;
    OptionSettings?: List<ConfigurationOptionSetting>;
    PlatformArn?: Value<string>;
    SolutionStackName?: Value<string>;
    SourceConfiguration?: SourceConfiguration;
}
export default class ConfigurationTemplate extends ResourceBase {
    static SourceConfiguration: typeof SourceConfiguration;
    static ConfigurationOptionSetting: typeof ConfigurationOptionSetting;
    constructor(properties?: ConfigurationTemplateProperties);
}
