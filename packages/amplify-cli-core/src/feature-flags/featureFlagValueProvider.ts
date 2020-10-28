import { FeatureFlagConfiguration } from '.';

export interface FeatureFlagValueProvider {
  load(): Promise<FeatureFlagConfiguration>;
}
