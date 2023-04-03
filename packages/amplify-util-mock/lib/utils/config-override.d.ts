export declare class ConfigOverrideManager {
    private static instance;
    private overrides;
    private amplifyMeta;
    constructor(context: any);
    addOverride(category: string, override: Record<string, any>): void;
    generateOverriddenFrontendExports(context: any): Promise<void>;
    restoreFrontendExports(context: any): Promise<void>;
    static getInstance(context: any): Promise<ConfigOverrideManager>;
}
//# sourceMappingURL=config-override.d.ts.map