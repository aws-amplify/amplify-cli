import { Context } from '../domain/context';
export declare function init(context: Context): Config;
export declare function getConfig(): Config;
export declare function write(context: Context, keyValues: unknown): void;
declare class Config {
    usageDataConfig: UsageDataConfig;
    private static instance;
    static get Instance(): Config;
    private constructor();
    setValues(keyValues: any): void;
}
declare class UsageDataConfig {
    installationUuid: string;
    isUsageTrackingEnabled: boolean;
    constructor();
}
export {};
//# sourceMappingURL=config.d.ts.map