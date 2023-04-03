import { AppSyncSimulatorDataSourceConfig, AppSyncSimulatorDataSourceType } from '../type-definition';
export interface AmplifyAppSyncSimulatorDataLoader {
    load(payload: any, extraData?: any): Promise<object | null>;
}
export declare function getDataLoader(sourceType: any): new (config?: AppSyncSimulatorDataSourceConfig) => AmplifyAppSyncSimulatorDataLoader;
export declare function addDataLoader(sourceType: AppSyncSimulatorDataSourceType, loader: new (config?: AppSyncSimulatorDataSourceConfig) => AmplifyAppSyncSimulatorDataLoader): void;
export declare function removeDataLoader(sourceType: AppSyncSimulatorDataSourceType): boolean;
//# sourceMappingURL=index.d.ts.map