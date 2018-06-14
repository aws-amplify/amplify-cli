import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class Scope {
    ComplianceResourceId?: Value<string>;
    ComplianceResourceTypes?: List<Value<string>>;
    TagKey?: Value<string>;
    TagValue?: Value<string>;
    constructor(properties: Scope);
}
export declare class Source {
    Owner: Value<string>;
    SourceDetails?: List<SourceDetail>;
    SourceIdentifier: Value<string>;
    constructor(properties: Source);
}
export declare class SourceDetail {
    EventSource: Value<string>;
    MaximumExecutionFrequency?: Value<string>;
    MessageType: Value<string>;
    constructor(properties: SourceDetail);
}
export interface ConfigRuleProperties {
    ConfigRuleName?: Value<string>;
    Description?: Value<string>;
    InputParameters?: any;
    MaximumExecutionFrequency?: Value<string>;
    Scope?: Scope;
    Source: Source;
}
export default class ConfigRule extends ResourceBase {
    static Scope: typeof Scope;
    static Source: typeof Source;
    static SourceDetail: typeof SourceDetail;
    constructor(properties?: ConfigRuleProperties);
}
