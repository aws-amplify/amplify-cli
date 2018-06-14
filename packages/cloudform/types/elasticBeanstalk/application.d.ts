import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export declare class ApplicationResourceLifecycleConfig {
    ServiceRole?: Value<string>;
    VersionLifecycleConfig?: ApplicationVersionLifecycleConfig;
    constructor(properties: ApplicationResourceLifecycleConfig);
}
export declare class ApplicationVersionLifecycleConfig {
    MaxAgeRule?: MaxAgeRule;
    MaxCountRule?: MaxCountRule;
    constructor(properties: ApplicationVersionLifecycleConfig);
}
export declare class MaxCountRule {
    DeleteSourceFromS3?: Value<boolean>;
    Enabled?: Value<boolean>;
    MaxCount?: Value<number>;
    constructor(properties: MaxCountRule);
}
export declare class MaxAgeRule {
    DeleteSourceFromS3?: Value<boolean>;
    Enabled?: Value<boolean>;
    MaxAgeInDays?: Value<number>;
    constructor(properties: MaxAgeRule);
}
export interface ApplicationProperties {
    ApplicationName?: Value<string>;
    Description?: Value<string>;
    ResourceLifecycleConfig?: ApplicationResourceLifecycleConfig;
}
export default class Application extends ResourceBase {
    static ApplicationResourceLifecycleConfig: typeof ApplicationResourceLifecycleConfig;
    static ApplicationVersionLifecycleConfig: typeof ApplicationVersionLifecycleConfig;
    static MaxCountRule: typeof MaxCountRule;
    static MaxAgeRule: typeof MaxAgeRule;
    constructor(properties?: ApplicationProperties);
}
