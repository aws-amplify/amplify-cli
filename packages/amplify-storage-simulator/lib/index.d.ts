import { StorageServer } from './server/S3server';
export interface StorageSimulatorDataSourceBaseConfig {
    name: string;
    type: string;
}
export type StorageSimulatorServerConfig = {
    port: number;
    route: string;
    localDirS3: string;
};
export declare class AmplifyStorageSimulator {
    private _server;
    private _serverConfig;
    constructor(serverConfig: StorageSimulatorServerConfig);
    start(): Promise<void>;
    stop(): void;
    get url(): string;
    get getServer(): StorageServer;
}
//# sourceMappingURL=index.d.ts.map