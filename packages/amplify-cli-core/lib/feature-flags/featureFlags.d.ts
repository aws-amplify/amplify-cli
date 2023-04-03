import { CLIEnvironmentProvider } from '../cliEnvironmentProvider';
import { FeatureFlagRegistration, FeatureFlagsEntry } from './featureFlagTypes';
export declare class FeatureFlags {
    private environmentProvider;
    private projectPath;
    private useNewDefaults;
    private static instance;
    private readonly registrations;
    private fileValueProvider;
    private envValueProvider;
    private effectiveFlags;
    private newProjectDefaults;
    private existingProjectDefaults;
    private constructor();
    static initialize: (environmentProvider: CLIEnvironmentProvider, useNewDefaults?: boolean, additionalFlags?: Record<string, FeatureFlagRegistration[]>) => Promise<void>;
    static ensureDefaultFeatureFlags: (newProject: boolean) => Promise<void>;
    static ensureFeatureFlag: (featureFlagSection: string, featureFlagName: string) => Promise<void>;
    static getBoolean: (flagName: string) => boolean;
    static getNumber: (flagName: string) => number;
    static getEffectiveFlags: () => Readonly<FeatureFlagsEntry>;
    static getNewProjectDefaults: () => Readonly<FeatureFlagsEntry>;
    static getExistingProjectDefaults: () => Readonly<FeatureFlagsEntry>;
    static removeFeatureFlagConfiguration: (removeProjectConfiguration: boolean, envNames: string[]) => Promise<void>;
    static isInitialized: () => boolean;
    static reloadValues: () => Promise<void>;
    private static removeOriginalConfigFile;
    private static ensureInitialized;
    private getValue;
    private buildJSONSchemaFromRegistrations;
    private buildDefaultValues;
    private validateFlags;
    private transformEnvFlags;
    private loadValues;
    private registerFlag;
    private registerFlags;
}
//# sourceMappingURL=featureFlags.d.ts.map