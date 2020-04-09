import { DocumentNode, GraphQLSchema } from 'graphql';
import { IncomingMessage, Server } from 'http';
import { AmplifyAppSyncAPIConfig } from '../type-definition';
import { extractHeader, extractJwtToken, getAuthorizationMode } from '../utils/auth-helpers';
import { AppSyncGraphQLExecutionContext } from '../utils/graphql-runner';
import { runSubscription, SubscriptionResult } from '../utils/graphql-runner/subscriptions';
import { ConnectionContext, WebsocketSubscriptionServer } from './subscription/websocket-server/server';
import { AmplifyAppSyncSimulator } from '..';

export class AppSyncSimulatorSubscriptionServer {
  private realtimeServer: WebsocketSubscriptionServer;
  constructor(private simulatorContext: AmplifyAppSyncSimulator, private server: Server, private subscriptionPath: string = '/graphql') {
    this.onSubscribe = this.onSubscribe.bind(this);
    this.onConnect = this.onConnect.bind(this);
    this.realtimeServer = new WebsocketSubscriptionServer(
      {
        onSubscribeHandler: this.onSubscribe,
        onConnectHandler: this.onConnect,
      },
      {
        server: this.server,
        path: this.subscriptionPath,
      },
    );
  }
  start() {
    this.realtimeServer.start();
  }
  stop() {
    this.realtimeServer.stop();
  }

  async onSubscribe(
    doc: DocumentNode,
    variable: Record<string, any>,
    headers: Record<string, any>,
    request: IncomingMessage,
    operationName?: string,
  ) {
    const ipAddress = request.socket.remoteAddress;
    const authorization = extractHeader(headers, 'Authorization');
    const jwt = extractJwtToken(authorization);
    const requestAuthorizationMode = getAuthorizationMode(headers, this.simulatorContext.appSyncConfig);
    const executionContext: AppSyncGraphQLExecutionContext = {
      jwt,
      sourceIp: ipAddress,
      headers,
      requestAuthorizationMode,
      appsyncErrors: [],
    };
    const subscriptionResult = await runSubscription(this.simulatorContext.schema, doc, variable, operationName, executionContext);
    if ((subscriptionResult as SubscriptionResult).asyncIterator) {
      return (subscriptionResult as SubscriptionResult).asyncIterator;
    }
    return subscriptionResult;
  }

  onConnect(message: ConnectionContext, headers: Record<string, any>) {
    this.authorizeRequest(headers);
  }

  authorizeRequest(headers: Record<string, string>) {
    return getAuthorizationMode(headers, this.simulatorContext.appSyncConfig);
  }
}
