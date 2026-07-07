import { FeatureFlagConfiguration } from './featureFlagTypes';

/**
 * Provides interface for feature flag value provider
 */
export interface FeatureFlagValueProvider {
  load: () => Promise<FeatureFlagConfiguration>;
}
