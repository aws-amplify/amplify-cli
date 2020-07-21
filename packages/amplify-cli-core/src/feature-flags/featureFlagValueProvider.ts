import { FeatureFlags } from '.';

export interface FeatureFlagValueProvider {
  load(): Promise<FeatureFlags>;
}
