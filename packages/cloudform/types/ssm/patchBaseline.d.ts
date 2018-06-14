import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class RuleGroup {
    PatchRules?: List<Rule>;
    constructor(properties: RuleGroup);
}
export declare class PatchFilter {
    Values?: List<Value<string>>;
    Key?: Value<string>;
    constructor(properties: PatchFilter);
}
export declare class Rule {
    EnableNonSecurity?: Value<boolean>;
    PatchFilterGroup?: PatchFilterGroup;
    ApproveAfterDays?: Value<number>;
    ComplianceLevel?: Value<string>;
    constructor(properties: Rule);
}
export declare class PatchFilterGroup {
    PatchFilters?: List<PatchFilter>;
    constructor(properties: PatchFilterGroup);
}
export declare class PatchSource {
    Products?: List<Value<string>>;
    Configuration?: Value<string>;
    Name?: Value<string>;
    constructor(properties: PatchSource);
}
export interface PatchBaselineProperties {
    OperatingSystem?: Value<string>;
    ApprovedPatches?: List<Value<string>>;
    PatchGroups?: List<Value<string>>;
    Description?: Value<string>;
    ApprovedPatchesComplianceLevel?: Value<string>;
    ApprovedPatchesEnableNonSecurity?: Value<boolean>;
    ApprovalRules?: RuleGroup;
    GlobalFilters?: PatchFilterGroup;
    Sources?: List<PatchSource>;
    Name: Value<string>;
    RejectedPatches?: List<Value<string>>;
}
export default class PatchBaseline extends ResourceBase {
    static RuleGroup: typeof RuleGroup;
    static PatchFilter: typeof PatchFilter;
    static Rule: typeof Rule;
    static PatchFilterGroup: typeof PatchFilterGroup;
    static PatchSource: typeof PatchSource;
    constructor(properties?: PatchBaselineProperties);
}
