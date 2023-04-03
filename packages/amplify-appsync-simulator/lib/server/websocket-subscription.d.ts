/// <reference types="node" />
import { DocumentNode } from 'graphql';
import { IncomingMessage, Server } from 'http';
import { AmplifyAppSyncSimulator } from '..';
import { ConnectionContext } from './subscription/websocket-server/server';
export declare class AppSyncSimulatorSubscriptionServer {
    private simulatorContext;
    private server;
    private subscriptionPath;
    private realtimeServer;
    constructor(simulatorContext: AmplifyAppSyncSimulator, server: Server, subscriptionPath?: string);
    start(): void;
    stop(): Promise<void>;
    onSubscribe: (doc: DocumentNode, variable: Record<string, any>, headers: Record<string, any>, request: IncomingMessage, operationName?: string) => Promise<import("graphql").ExecutionResult<{
        [key: string]: any;
    }, {
        [key: string]: any;
    }> | AsyncIterableIterator<import("graphql").ExecutionResult<{
        [key: string]: any;
    }, {
        [key: string]: any;
    }>>>;
    onConnect: (message: ConnectionContext, headers: Record<string, any>) => void;
    authorizeRequest: (headers: Record<string, string>) => import("..").AmplifyAppSyncSimulatorAuthenticationType;
}
//# sourceMappingURL=websocket-subscription.d.ts.map