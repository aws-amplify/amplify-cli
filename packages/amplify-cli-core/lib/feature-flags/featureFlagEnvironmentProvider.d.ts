import { FeatureFlagConfiguration } from './featureFlagTypes';
import { FeatureFlagValueProvider } from './featureFlagValueProvider';
export type FeatureFlagEnvironmentProviderOptions = {
    prefix?: string;
    environmentNameSeparator?: string;
    noEnvironmentNameSeparator?: string;
    envPathSeparator?: string;
    internalSeparator?: string;
    projectPath?: string;
};
export declare class FeatureFlagEnvironmentProvider implements FeatureFlagValueProvider {
    private options;
    constructor(options?: FeatureFlagEnvironmentProviderOptions);
    load: () => Promise<FeatureFlagConfiguration>;
    private parseUntilNextSeparator;
    private setValue;
}
//# sourceMappingURL=featureFlagEnvironmentProvider.d.ts.map