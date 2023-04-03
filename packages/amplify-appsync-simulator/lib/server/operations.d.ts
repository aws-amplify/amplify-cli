import express from 'express';
import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorServerConfig } from '../type-definition';
export declare class OperationServer {
    private config;
    private simulatorContext;
    private _app;
    constructor(config: AppSyncSimulatorServerConfig, simulatorContext: AmplifyAppSyncSimulator);
    private handleClearDBData;
    private handleAPIInfoRequest;
    private handleRequest;
    get app(): express.Application;
}
//# sourceMappingURL=operations.d.ts.map