export type FrontendConfig = {
    frontend: string;
    framework: string;
    config: {
        SourceDir: string;
        DistributionDir: string;
        BuildCommand: string;
        StartCommand: string;
    };
};
export declare function headlessPull(projectRootDirPath: string, amplifyParam: Record<string, unknown>, providersParam: Record<string, unknown>, categoryConfig?: Record<string, unknown>, frontendConfig?: FrontendConfig): Promise<void>;
export declare function authConfigPull(projectRootDirPath: string, params: {
    appId: string;
    envName: string;
}, settings?: Record<string, unknown>): Promise<void>;
