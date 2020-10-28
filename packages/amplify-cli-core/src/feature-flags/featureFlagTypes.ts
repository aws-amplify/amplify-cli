export type FeatureFlagsEntry = Record<string, Record<string, {}>>;

export type FeatureFlagConfiguration = {
  project: FeatureFlagsEntry;
  environments: Record<string, FeatureFlagsEntry>;
};

export type FeatureFlagType = 'number' | 'string' | 'boolean';

export type FeatureFlagRegistration = StringFeatureFlag | NumberFeatureFlag | BooleanFeatureFlag;

export type StringFeatureFlag = {
  type: 'string';
  name: string;
  defaultValueForExistingProjects: string;
  defaultValueForNewProjects: string;
};

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
