"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const websocket_subscription_1 = require("../../server/websocket-subscription");
const schema_1 = require("@graphql-tools/schema");
const graphql_1 = require("graphql");
const http_1 = require("http");
const auth_helpers_1 = require("../../utils/auth-helpers");
const subscriptions_1 = require("../../utils/graphql-runner/subscriptions");
const server_1 = require("../../server/subscription/websocket-server/server");
const type_definition_1 = require("../../type-definition");
const graphql_subscriptions_1 = require("graphql-subscriptions");
jest.mock('../../server/subscription/websocket-server/server');
jest.mock('../../utils/graphql-runner/subscriptions');
jest.mock('../../utils/auth-helpers');
jest.mock('http');
describe('websocket subscription', () => {
    const createServerMock = http_1.createServer;
    const schemaDoc = (0, graphql_1.parse)(`
    type Query {
      echo: String!
    }
  `);
    const schema = (0, schema_1.makeExecutableSchema)({
        typeDefs: schemaDoc,
        resolvers: {
            Query: {
                echo: jest.fn(),
            },
        },
    });
    const appSyncConfig = {
        additionalAuthenticationProviders: [],
        defaultAuthenticationType: { authenticationType: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY },
        name: 'AppSync',
        apiKey: 'fake-key',
    };
    const simulatorContext = {
        schema,
        appSyncConfig,
    };
    const subscriptionPath = '/subscribe';
    let server;
    beforeEach(() => {
        jest.resetAllMocks();
        server = (0, http_1.createServer)();
    });
    createServerMock.mockReturnValue('MOCK Server');
    it('should initialize websocket server', () => {
        const subs = new websocket_subscription_1.AppSyncSimulatorSubscriptionServer(simulatorContext, server, subscriptionPath);
        expect(server_1.WebsocketSubscriptionServer).toHaveBeenCalledWith({
            onSubscribeHandler: subs.onSubscribe,
            onConnectHandler: subs.onConnect,
        }, {
            server,
            path: subscriptionPath,
        });
    });
    it('should call websocket servers start method when start is called', () => {
        const startSpy = jest.spyOn(server_1.WebsocketSubscriptionServer.prototype, 'start');
        const subs = new websocket_subscription_1.AppSyncSimulatorSubscriptionServer(simulatorContext, server, subscriptionPath);
        subs.start();
        expect(startSpy).toHaveBeenCalled();
    });
    it('should call websocket servers stop method when stop is called', () => {
        const stopSpy = jest.spyOn(server_1.WebsocketSubscriptionServer.prototype, 'stop');
        const subs = new websocket_subscription_1.AppSyncSimulatorSubscriptionServer(simulatorContext, server, subscriptionPath);
        subs.stop();
        expect(stopSpy).toHaveBeenCalled();
    });
    describe('onConnect', () => {
        let subsServer;
        beforeEach(() => {
            subsServer = new websocket_subscription_1.AppSyncSimulatorSubscriptionServer(simulatorContext, server, subscriptionPath);
        });
        it('should authorize the request onConnect', () => {
            const connectionContext = {
                request: {},
                socket: {},
                subscriptions: new Map(),
                isConnectionInitialized: false,
            };
            const header = {
                authorization: 'token here',
            };
            expect(subsServer.onConnect(connectionContext, header)).toBeUndefined();
            expect(auth_helpers_1.getAuthorizationMode).toHaveBeenCalledWith(header, appSyncConfig);
        });
        it('should throw error when authCheck fails', () => {
            auth_helpers_1.getAuthorizationMode.mockImplementation(() => {
                throw new Error('UnAuthorized');
            });
            const connectionContext = {
                request: {},
                socket: {},
                subscriptions: new Map(),
                isConnectionInitialized: false,
            };
            const header = {
                authorization: 'token here',
            };
            expect(() => subsServer.onConnect(connectionContext, header)).toThrowError('UnAuthorized');
            expect(auth_helpers_1.getAuthorizationMode).toHaveBeenCalledWith(header, appSyncConfig);
        });
    });
    describe('onSubscribe', () => {
        let subsServer;
        let asyncIterator = new graphql_subscriptions_1.PubSub().asyncIterator('onMessage');
        const tokenString = 'token-here';
        const jwt = { iss: 'some issuer' };
        const doc = (0, graphql_1.parse)(`
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
        };
        const operationName = 'onMessage';
        const authorizationMode = type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY;
        beforeEach(() => {
            subsServer = new websocket_subscription_1.AppSyncSimulatorSubscriptionServer(simulatorContext, server, subscriptionPath);
            auth_helpers_1.extractHeader.mockReturnValue(tokenString);
            auth_helpers_1.extractJwtToken.mockReturnValue(jwt);
            auth_helpers_1.getAuthorizationMode.mockReturnValue(authorizationMode);
        });
        it('should execute subscription resolver', async () => {
            subscriptions_1.runSubscription.mockReturnValue(asyncIterator);
            await expect(subsServer.onSubscribe(doc, vars, headers, request, operationName)).resolves.toEqual(asyncIterator);
            expect(auth_helpers_1.extractHeader).toHaveBeenCalledWith(headers, 'Authorization');
            expect(auth_helpers_1.extractJwtToken).toHaveBeenCalledWith(tokenString);
            expect(subscriptions_1.runSubscription).toHaveBeenCalledWith(schema, doc, vars, operationName, {
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
            subscriptions_1.runSubscription.mockReturnValue(errors);
            await expect(subsServer.onSubscribe(doc, vars, headers, request, operationName)).resolves.toEqual(errors);
        });
    });
});
//# sourceMappingURL=websocket-subscription.test.js.map