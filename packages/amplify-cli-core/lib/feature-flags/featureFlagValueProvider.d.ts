import { FeatureFlagConfiguration } from './featureFlagTypes';
export interface FeatureFlagValueProvider {
    load: () => Promise<FeatureFlagConfiguration>;
}
//# sourceMappingURL=featureFlagValueProvider.d.ts.map