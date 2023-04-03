export declare class DebugConfig {
    private static instance;
    private debug;
    private dirty;
    static get Instance(): DebugConfig;
    private constructor();
    private getCLIJson;
    setShareProjectConfig(shareProjectConfig: boolean | undefined): void;
    writeShareProjectConfig(): void;
    getCanSendReport(): boolean;
    promptSendReport(): boolean;
    setAndWriteShareProject(shareProjectConfig: boolean | undefined): void;
}
//# sourceMappingURL=debug-config.d.ts.map