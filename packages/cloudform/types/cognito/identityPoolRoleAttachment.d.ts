import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class RulesConfigurationType {
    Rules: List<MappingRule>;
    constructor(properties: RulesConfigurationType);
}
export declare class RoleMapping {
    Type: Value<string>;
    AmbiguousRoleResolution?: Value<string>;
    RulesConfiguration?: RulesConfigurationType;
    constructor(properties: RoleMapping);
}
export declare class MappingRule {
    MatchType: Value<string>;
    Value: Value<string>;
    Claim: Value<string>;
    RoleARN: Value<string>;
    constructor(properties: MappingRule);
}
export interface IdentityPoolRoleAttachmentProperties {
    RoleMappings?: any;
    IdentityPoolId: Value<string>;
    Roles?: any;
}
export default class IdentityPoolRoleAttachment extends ResourceBase {
    static RulesConfigurationType: typeof RulesConfigurationType;
    static RoleMapping: typeof RoleMapping;
    static MappingRule: typeof MappingRule;
    constructor(properties?: IdentityPoolRoleAttachmentProperties);
}
