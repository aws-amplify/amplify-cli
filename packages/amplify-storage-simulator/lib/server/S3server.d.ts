/// <reference types="node" />
import { EventEmitter } from 'events';
import { StorageSimulatorServerConfig } from '../index';
export declare class StorageServer extends EventEmitter {
    private config;
    private app;
    private server;
    private connection;
    private route;
    url: string;
    private uploadIds;
    private upload_bufferMap;
    private localDirectoryPath;
    constructor(config: StorageSimulatorServerConfig);
    start(): any;
    stop(): void;
    private handleRequestAll;
    private handleRequestGet;
    private handleRequestList;
    private handleRequestDelete;
    private handleRequestPut;
    private handleRequestPost;
    private createEvent;
}
//# sourceMappingURL=S3server.d.ts.map