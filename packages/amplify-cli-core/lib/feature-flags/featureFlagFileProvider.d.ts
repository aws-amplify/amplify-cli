import { FeatureFlagConfiguration } from './featureFlagTypes';
import { FeatureFlagValueProvider } from './featureFlagValueProvider';
import { CLIEnvironmentProvider } from '../cliEnvironmentProvider';
export type FeatureFlagFileProviderOptions = {
    projectPath?: string;
};
export declare class FeatureFlagFileProvider implements FeatureFlagValueProvider {
    private environmentProvider;
    private options;
    constructor(environmentProvider: CLIEnvironmentProvider, options?: FeatureFlagFileProviderOptions);
    load: () => Promise<FeatureFlagConfiguration>;
    private loadConfig;
}
//# sourceMappingURL=featureFlagFileProvider.d.ts.map