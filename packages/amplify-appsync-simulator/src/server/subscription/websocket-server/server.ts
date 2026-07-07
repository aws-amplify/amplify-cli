import { DocumentNode, parse } from 'graphql';
import { ExecutionResult } from 'graphql/execution/execute';
import { IncomingMessage } from 'http';
import * as WebSocket from 'ws';
import { Server as WebSocketServer, ServerOptions } from 'ws';
import {
  GQLMessageConnectionAck,
  GQLMessageSubscriptionStart,
  GQLMessageSubscriptionStop,
  isSubscriptionConnectionInitMessage,
  isSubscriptionStartMessage,
  isSubscriptionStopMessage,
} from './message-type-guards';
import { MESSAGE_TYPES } from './message-types';
import { decodeHeaderFromQueryParam } from './utils';

export const REALTIME_SUBSCRIPTION_PATH = '/graphql/realtime';
const PROTOCOL = 'graphql-ws';
const KEEP_ALIVE_TIMEOUT = 4 * 60 * 1000; // Wait time between Keep Alive Message
// Max time the client will wait for Keep Alive message before disconnecting. Sent to the client as part of connection ack
const CONNECTION_TIMEOUT_DURATION = 5 * 60 * 1000;

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
  onSubscribeHandler: (
    query: DocumentNode,
    variable: Record<string, any>,
    headers: Record<string, any>,
    request: IncomingMessage,
  ) => Promise<AsyncIterableIterator<ExecutionResult> | ExecutionResult>;
  keepAlive?: number;
  connectionTimeoutDuration?: number;
};

const DEFAULT_OPTIONS: Partial<WebsocketSubscriptionServerOptions> = {
  onConnectHandler: async () => {
    // empty
  },
  keepAlive: KEEP_ALIVE_TIMEOUT,
  connectionTimeoutDuration: CONNECTION_TIMEOUT_DURATION,
};

export class WebsocketSubscriptionServer {
  private options: WebsocketSubscriptionServerOptions;
  private connections: Set<ConnectionContext>;
  private webSocketServer: WebSocketServer;

  constructor(options: WebsocketSubscriptionServerOptions, server?: ServerOptions) {
    this.connections = new Set();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    if (server) {
      this.attachWebServer(server);
    }
  }

  attachWebServer(serverOptions: ServerOptions): void {
    this.webSocketServer = new WebSocketServer({ ...serverOptions, path: REALTIME_SUBSCRIPTION_PATH });
  }

  start() {
    if (!this.webSocketServer) {
      throw new Error('No server is attached');
    }
    /* eslint-disable @typescript-eslint/no-misused-promises */
    this.webSocketServer.on('connection', this.onSocketConnection);
  }

  async stop() {
    this.webSocketServer?.off('connection', this.onSocketConnection);
    /* eslint-enable */
    for (const connection of Array.from(this.connections)) {
      await this.onClose(connection);
    }
    this.webSocketServer?.close();
  }

  private onClose = async (connectionContext: ConnectionContext): Promise<void> => {
    for (const subscription of Array.from(connectionContext.subscriptions.values())) {
      await this.stopAsyncIterator(connectionContext, subscription.id);
    }
    if (connectionContext.pingIntervalHandle) {
      clearInterval(connectionContext.pingIntervalHandle);
      connectionContext.pingIntervalHandle = null;
    }
    this.connections.delete(connectionContext);
  };

  private onUnsubscribe = async (
    connectionContext: ConnectionContext,
    messageOrSubscriptionId: GQLMessageSubscriptionStop,
  ): Promise<void> => {
    const { id } = messageOrSubscriptionId;
    await this.stopAsyncIterator(connectionContext, id);
    this.sendMessage(connectionContext, id, MESSAGE_TYPES.GQL_COMPLETE, {});
  };

  private stopAsyncIterator = async (connectionContext: ConnectionContext, id: string): Promise<void> => {
    if (connectionContext.subscriptions && connectionContext.subscriptions.has(id)) {
      const subscription = connectionContext.subscriptions.get(id);
      if (subscription.asyncIterator) {
        await subscription.asyncIterator.return();
      }

      connectionContext.subscriptions.delete(id);
    }
  };

  private onSocketConnection = async (socket: WebSocket, request: IncomingMessage): Promise<void> => {
    (socket as any).upgradeReq = request;
    try {
      if (typeof socket.protocol === 'undefined' || socket.protocol !== PROTOCOL) {
        throw new Error('Invalid protocol');
      }
      const connectionContext: ConnectionContext = {
        request,
        socket,
        subscriptions: new Map(),
        isConnectionInitialized: false,
      };
      const headers = decodeHeaderFromQueryParam(request.url);

      await this.options.onConnectHandler(connectionContext, headers);

      this.connections.add(connectionContext);

      const onMessage = (message) => {
        void this.onMessage(connectionContext, message);
      };

      const onClose = async (error?: Error | string) => {
        socket.off('message', onMessage);
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        socket.off('close', onClose);
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        socket.off('error', onClose);
        await this.onSocketDisconnection(connectionContext, error);
      };

      socket.on('message', onMessage);
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      socket.on('close', onClose);
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      socket.on('error', onClose);
    } catch (e) {
      socket.close(1002); // protocol error
      return;
    }
  };

  private onSocketDisconnection = async (connectionContext: ConnectionContext, error?: Error | string): Promise<void> => {
    await this.onClose(connectionContext);
    if (error) {
      this.sendError(connectionContext, '', { message: error instanceof Error ? error.message : error });
      setTimeout(() => {
        // 1011 is an unexpected condition prevented the request from being fulfilled
        connectionContext.socket.close(1011);
      }, 10);
    }
  };

  private onMessage = (connectionContext: ConnectionContext, rawMessage: string) => {
    const message = JSON.parse(rawMessage);
    try {
      switch (message.type) {
        case MESSAGE_TYPES.GQL_CONNECTION_INIT:
          if (isSubscriptionConnectionInitMessage(message)) {
            return this.onConnectionInit(connectionContext);
          }
          break;
        case MESSAGE_TYPES.GQL_START:
          if (isSubscriptionStartMessage(message)) {
            return this.onSubscriptionStart(connectionContext, message);
          }
          break;
        case MESSAGE_TYPES.GQL_STOP:
          if (isSubscriptionStopMessage(message)) {
            return this.onUnsubscribe(connectionContext, message);
          }
      }
      throw new Error('Invalid message');
    } catch (e) {
      this.sendError(connectionContext, '', { errors: [{ message: e.message }] });
    }
    return undefined;
  };

  private sendMessage = (connectionContext: ConnectionContext, subscriptionId: string, type: MESSAGE_TYPES, data: any): void => {
    const message = {
      type,
      id: subscriptionId,
      payload: data,
    };
    if (connectionContext.socket.readyState === WebSocket.OPEN) {
      connectionContext.socket.send(JSON.stringify(message));
    }
  };
  private sendError = (
    connectionContext: ConnectionContext,
    subscriptionId: string,
    errorPayload: any,
    type: MESSAGE_TYPES.GQL_ERROR | MESSAGE_TYPES.GQL_CONNECTION_ERROR = MESSAGE_TYPES.GQL_ERROR,
  ) => {
    if ([MESSAGE_TYPES.GQL_CONNECTION_ERROR, MESSAGE_TYPES.GQL_ERROR].indexOf(type) === -1) {
      throw new Error(`Message type should for error should be one of ${MESSAGE_TYPES.GQL_ERROR} or ${MESSAGE_TYPES.GQL_CONNECTION_ERROR}`);
    }
    this.sendMessage(connectionContext, subscriptionId, type, errorPayload);
  };
  private setupPing = (connectionContext: ConnectionContext): void => {
    connectionContext.pingIntervalHandle = setInterval(() => {
      this.sendMessage(connectionContext, undefined, MESSAGE_TYPES.GQL_CONNECTION_KEEP_ALIVE, undefined);
    }, this.options.keepAlive) as any;
  };

  private onConnectionInit = (connectionContext: ConnectionContext): void => {
    connectionContext.isConnectionInitialized = true;
    const response: GQLMessageConnectionAck = {
      type: MESSAGE_TYPES.GQL_CONNECTION_ACK,
      payload: {
        connectionTimeout: this.options.connectionTimeoutDuration,
      },
    };
    this.sendMessage(connectionContext, undefined, response.type, response.payload);
    this.setupPing(connectionContext);

    // Regular keep alive messages if keepAlive is set
    this.setupPing(connectionContext);
  };

  private onSubscriptionStart = async (connectionContext: ConnectionContext, message: GQLMessageSubscriptionStart): Promise<void> => {
    const id = message.id;
    const data = JSON.parse(message.payload.data);
    const query = parse(data.query);
    const variables = data.variables;
    const headers = message.payload.extensions.authorization;
    if (connectionContext.subscriptions && connectionContext.subscriptions.has(id)) {
      await this.stopAsyncIterator(connectionContext, id);
    }
    const asyncIterator = await this.options.onSubscribeHandler(query, variables, headers, connectionContext.request);
    if ((asyncIterator as ExecutionResult).errors) {
      const error = {
        errors: (asyncIterator as ExecutionResult).errors,
        data: (asyncIterator as ExecutionResult).data || null,
      };
      this.sendError(connectionContext, id, error, MESSAGE_TYPES.GQL_ERROR);
    } else {
      const subscription: WebsocketSubscription = {
        id,
        asyncIterator: asyncIterator as AsyncIterableIterator<any>,
        document: query,
        variables,
      };
      connectionContext.subscriptions.set(id, subscription);
      this.sendMessage(connectionContext, id, MESSAGE_TYPES.GQL_START_ACK, {});
      await this.attachAsyncIterator(connectionContext, subscription);
    }
  };

  private attachAsyncIterator = async (connectionContext: ConnectionContext, sub: WebsocketSubscription): Promise<void> => {
    const { asyncIterator, id } = sub;
    let done = false;
    do {
      const { value, done: doneResult } = await asyncIterator.next();
      done = doneResult;
      if (done) {
        break;
      }
      this.sendMessage(connectionContext, id, MESSAGE_TYPES.GQL_DATA, value);
    } while (!done);
  };
}
