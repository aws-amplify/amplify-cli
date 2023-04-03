import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorServerConfig } from '../type-definition';
export declare class AppSyncSimulatorServer {
    private config;
    private simulatorContext;
    private _operationServer;
    private _httpServer;
    private _realTimeSubscriptionServer;
    private _url;
    constructor(config: AppSyncSimulatorServerConfig, simulatorContext: AmplifyAppSyncSimulator);
    start(): Promise<void>;
    stop(): Promise<void>;
    get url(): {
        graphql: string;
    };
}
//# sourceMappingURL=index.d.ts.map