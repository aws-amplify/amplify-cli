/// <reference types="node" />
/// <reference types="node" />
import { DocumentNode } from 'graphql';
import { ExecutionResult } from 'graphql/execution/execute';
import { IncomingMessage } from 'http';
import * as WebSocket from 'ws';
import { ServerOptions } from 'ws';
export declare const REALTIME_SUBSCRIPTION_PATH = "/graphql/realtime";
export type WebsocketSubscription = {
    id: string;
    variables: Record<string, any>;
    asyncIterator: AsyncIterator<any>;
    document: DocumentNode;
};
export type ConnectionContext = {
    socket: WebSocket;
    request: IncomingMessage;
    subscriptions: Map<string, WebsocketSubscription>;
    pingIntervalHandle?: NodeJS.Timeout;
    isConnectionInitialized: boolean;
};
export type WebsocketSubscriptionServerOptions = {
    onConnectHandler?: (connectionContext: ConnectionContext, header: Record<string, any>) => Promise<void> | void;
    onSubscribeHandler: (query: DocumentNode, variable: Record<string, any>, headers: Record<string, any>, request: IncomingMessage) => Promise<AsyncIterableIterator<ExecutionResult> | ExecutionResult>;
    keepAlive?: number;
    connectionTimeoutDuration?: number;
};
export declare class WebsocketSubscriptionServer {
    private options;
    private connections;
    private webSocketServer;
    constructor(options: WebsocketSubscriptionServerOptions, server?: ServerOptions);
    attachWebServer(serverOptions: ServerOptions): void;
    start(): void;
    stop(): Promise<void>;
    private onClose;
    private onUnsubscribe;
    private stopAsyncIterator;
    private onSocketConnection;
    private onSocketDisconnection;
    private onMessage;
    private sendMessage;
    private sendError;
    private setupPing;
    private onConnectionInit;
    private onSubscriptionStart;
    private attachAsyncIterator;
}
//# sourceMappingURL=server.d.ts.map