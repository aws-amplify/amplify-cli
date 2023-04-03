import { FeatureFlagsEntry } from 'amplify-cli-core';
type FeatureFlagData = {
    features: FeatureFlagsEntry;
};
export declare const loadFeatureFlags: (projectRoot: string) => FeatureFlagData;
export declare const saveFeatureFlagFile: (projectRoot: string, data: FeatureFlagData) => void;
/**
 * Set an feature flag
 * @param section Feature flag section
 * @param name feature flag name
 * @param value value for the feature flag
 */
export declare const addFeatureFlag: (projectRoot: string, section: string, name: string, value: boolean | number) => void;
export {};
