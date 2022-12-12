/* eslint-disable-next-line import/no-cycle */
import { $TSAny } from "../types";

/**
 * Collection of feature flags input
 */
export type FeatureFlagsEntry = Record<string, Record<string, $TSAny>>;

/**
 * All feature flags present for the project
 */
export type FeatureFlagConfiguration = {
  project: FeatureFlagsEntry;
  environments: Record<string, FeatureFlagsEntry>;
};

/**
 * Allowed Feature flag types
 *
 * New feature flags should be a boolean
 */
export type FeatureFlagType = "boolean" | "number";

/**
 * Feature flags are registered in the registerFlags function of the FeatureFlags class
 *
 * type: 'boolean' | 'number'
 * name: string
 * defaultValueForExistingProjects: boolean | number
 * defaultValueForNewProjects: boolean | number
 */
export type FeatureFlagRegistration = NumberFeatureFlag | BooleanFeatureFlag;

/**
 * Number Feature flag registration
 *
 * @deprecated due to complexity of ignoring an unknown number Feature Flag
 */
export type NumberFeatureFlag = {
  type: "number";
  name: string;
  defaultValueForExistingProjects: number;
  defaultValueForNewProjects: number;
};

/**
 * Boolean Feature flag registration
 */
export type BooleanFeatureFlag = {
  type: "boolean";
  name: string;
  defaultValueForExistingProjects: boolean;
  defaultValueForNewProjects: boolean;
};
