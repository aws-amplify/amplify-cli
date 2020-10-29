import { AppSyncSimulatorSubscriptionServer } from '../../server/websocket-subscription';

import { makeExecutableSchema } from 'graphql-tools';
import { parse } from 'graphql';
import { IncomingMessage, Server, createServer } from 'http';
import * as WebSocket from 'ws';

import { getAuthorizationMode, extractJwtToken, extractHeader } from '../../utils/auth-helpers';
import { runSubscription, SubscriptionResult } from '../../utils/graphql-runner/subscriptions';
import { ConnectionContext, WebsocketSubscriptionServer } from '../../server/subscription/websocket-server/server';
import { AmplifyAppSyncAPIConfig, AmplifyAppSyncSimulatorAuthenticationType } from '../../type-definition';
import { PubSub } from 'graphql-subscriptions';
import { AmplifyAppSyncSimulator } from '../..';

jest.mock('../../server/subscription/websocket-server/server');
jest.mock('../../utils/graphql-runner/subscriptions');
jest.mock('../../utils/auth-helpers');
jest.mock('http');

describe('websocket subscription', () => {
  const createServerMock = createServer as jest.Mock;
  const schemaDoc = parse(/* GraphQL */ `
    type Query {
      echo: String!
    }
  `);

  const schema = makeExecutableSchema({
    typeDefs: schemaDoc,
    resolvers: {
      Query: {
        echo: jest.fn(),
      },
    },
  });

  const appSyncConfig: AmplifyAppSyncAPIConfig = {
    additionalAuthenticationProviders: [],
    defaultAuthenticationType: { authenticationType: AmplifyAppSyncSimulatorAuthenticationType.API_KEY },
    name: 'AppSync',
    apiKey: 'fake-key',
  };
  const simulatorContext: AmplifyAppSyncSimulator = {
    schema,
    appSyncConfig,
  } as AmplifyAppSyncSimulator;

  const subscriptionPath = '/subscribe';
  let server: Server;
  beforeEach(() => {
    jest.resetAllMocks();
    server = createServer();
  });

  createServerMock.mockReturnValue('MOCK Server');

  it('should initialize websocket server', () => {
    const subs = new AppSyncSimulatorSubscriptionServer(simulatorContext, server, subscriptionPath);
    expect(WebsocketSubscriptionServer).toHaveBeenCalledWith(
      {
        onSubscribeHandler: subs.onSubscribe,
        onConnectHandler: subs.onConnect,
      },
      {
        server,
        path: subscriptionPath,
      },
    );
  });

  it('should call websocket servers start method when start is called', () => {
    const startSpy = jest.spyOn(WebsocketSubscriptionServer.prototype, 'start');
    const subs = new AppSyncSimulatorSubscriptionServer(simulatorContext, server, subscriptionPath);
    subs.start();
    expect(startSpy).toHaveBeenCalled();
  });

  it('should call websocket servers stop method when stop is called', () => {
    const stopSpy = jest.spyOn(WebsocketSubscriptionServer.prototype, 'stop');
    const subs = new AppSyncSimulatorSubscriptionServer(simulatorContext, server, subscriptionPath);
    subs.stop();
    expect(stopSpy).toHaveBeenCalled();
  });

  describe('onConnect', () => {
    let subsServer;
    beforeEach(() => {
      subsServer = new AppSyncSimulatorSubscriptionServer(simulatorContext, server, subscriptionPath);
    });
    it('should authorize the request onConnect', () => {
      const connectionContext: ConnectionContext = {
        request: {} as IncomingMessage,
        socket: {} as WebSocket,
        subscriptions: new Map(),
        isConnectionInitialized: false,
      };
      const header = {
        authorization: 'token here',
      };
      expect(subsServer.onConnect(connectionContext, header)).toBeUndefined();
      expect(getAuthorizationMode).toHaveBeenCalledWith(header, appSyncConfig);
    });

    it('should throw error when authCheck fails', () => {
      (getAuthorizationMode as jest.Mock).mockImplementation(() => {
        throw new Error('UnAuthorized');
      });
      const connectionContext: ConnectionContext = {
        request: {} as IncomingMessage,
        socket: {} as WebSocket,
        subscriptions: new Map(),
        isConnectionInitialized: false,
      };
      const header = {
        authorization: 'token here',
      };
      expect(() => subsServer.onConnect(connectionContext, header)).toThrowError('UnAuthorized');
      expect(getAuthorizationMode).toHaveBeenCalledWith(header, appSyncConfig);
    });
  });

  describe('onSubscribe', () => {
    let subsServer: AppSyncSimulatorSubscriptionServer;
    let asyncIterator = new PubSub().asyncIterator('onMessage');
    const tokenString = 'token-here';
    const jwt = { iss: 'some issuer' };
    const doc = parse(/* GraphQL */ `
      subscription onMessage {
        onMessage
      }
    `);
    const vars = {
      var1: 'value1',
    };
    const headers = {
      authorization: 'token',
    };
    const request = {
      socket: {
        remoteAddress: '127.0.0.1',
      },
    } as IncomingMessage;
    const operationName = 'onMessage';
    const authorizationMode = AmplifyAppSyncSimulatorAuthenticationType.API_KEY;

    beforeEach(() => {
      subsServer = new AppSyncSimulatorSubscriptionServer(simulatorContext, server, subscriptionPath);
      (extractHeader as jest.Mock).mockReturnValue(tokenString);
      (extractJwtToken as jest.Mock).mockReturnValue(jwt);
      (getAuthorizationMode as jest.Mock).mockReturnValue(authorizationMode);
    });

    it('should execute subscription resolver', async () => {
      (runSubscription as jest.Mock).mockReturnValue(asyncIterator);
      await expect(subsServer.onSubscribe(doc, vars, headers, request, operationName)).resolves.toEqual(asyncIterator);
      expect(extractHeader).toHaveBeenCalledWith(headers, 'Authorization');
      expect(extractJwtToken).toHaveBeenCalledWith(tokenString);
      expect(runSubscription).toHaveBeenCalledWith(schema, doc, vars, operationName, {
        jwt,
        sourceIp: '127.0.0.1',
        headers,
        requestAuthorizationMode: authorizationMode,
        appsyncErrors: [],
      });
    });

    it('should should return error when subscription results in error', async () => {
      const errors = [
        {
          name: 'Authorization',
          message: 'Un Authorized',
        },
      ];
      (runSubscription as jest.Mock).mockReturnValue(errors);
      await expect(subsServer.onSubscribe(doc, vars, headers, request, operationName)).resolves.toEqual(errors);
    });
  });
});
