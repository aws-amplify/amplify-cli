import { $TSAny } from '../types';
export type FeatureFlagsEntry = Record<string, Record<string, $TSAny>>;
export type FeatureFlagConfiguration = {
    project: FeatureFlagsEntry;
    environments: Record<string, FeatureFlagsEntry>;
};
export type FeatureFlagType = 'boolean' | 'number';
export type FeatureFlagRegistration = NumberFeatureFlag | BooleanFeatureFlag;
export type NumberFeatureFlag = {
    type: 'number';
    name: string;
    defaultValueForExistingProjects: number;
    defaultValueForNewProjects: number;
};
export type BooleanFeatureFlag = {
    type: 'boolean';
    name: string;
    defaultValueForExistingProjects: boolean;
    defaultValueForNewProjects: boolean;
};
//# sourceMappingURL=featureFlagTypes.d.ts.map