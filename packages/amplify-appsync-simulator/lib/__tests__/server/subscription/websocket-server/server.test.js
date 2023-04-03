"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const url_1 = require("url");
const ws_1 = __importDefault(require("ws"));
const get_port_1 = __importDefault(require("get-port"));
const graphql_subscriptions_1 = require("graphql-subscriptions");
const graphql_1 = require("graphql");
const server_1 = require("../../../../server/subscription/websocket-server/server");
const server_2 = require("../../../../server/subscription/websocket-server/server");
const message_types_1 = require("../../../../server/subscription/websocket-server/message-types");
const SOCKET_TIMEOUT = 10000;
jest.setTimeout(60000);
async function waitForConnection(socket) {
    return new Promise((resolve, reject) => {
        let done = false;
        const timeoutHandle = setTimeout(() => {
            done = true;
            reject('Websocket Timed out');
        }, SOCKET_TIMEOUT);
        socket.onopen = () => {
            if (!done) {
                clearTimeout(timeoutHandle);
                resolve();
            }
        };
    });
}
async function waitForMessage(socket, messageType, maxDuration = 15000) {
    return new Promise((resolve, reject) => {
        let done = false;
        const timer = setTimeout(() => {
            done = true;
            reject('Waiting for the message timed out');
        }, maxDuration);
        socket.onmessage = (msg) => {
            const payload = JSON.parse(msg.data);
            if (payload.type === messageType) {
                if (!done) {
                    done = true;
                    clearTimeout(timer);
                    resolve(payload);
                }
            }
        };
    });
}
describe('WebsocketSubscriptionServer', () => {
    let server;
    let httpServer;
    const onSubscribeHandler = jest.fn();
    const onConnectHandler = jest.fn();
    let serverPort = 20005;
    let connectionTimeoutDuration;
    let keepAlive;
    beforeEach(async () => {
        jest.resetAllMocks();
        httpServer = (0, http_1.createServer)();
        connectionTimeoutDuration = 500;
        keepAlive = 100;
        server = new server_2.WebsocketSubscriptionServer({
            onSubscribeHandler,
            onConnectHandler,
            connectionTimeoutDuration,
            keepAlive,
        }, { server: httpServer, path: server_1.REALTIME_SUBSCRIPTION_PATH });
        serverPort = await (0, get_port_1.default)({
            port: get_port_1.default.makeRange(20001, 65536),
        });
        httpServer.listen(serverPort);
        server.start();
    });
    afterEach(() => {
        server === null || server === void 0 ? void 0 : server.stop();
        httpServer === null || httpServer === void 0 ? void 0 : httpServer.close();
    });
    beforeAll((done) => {
        done();
    });
    afterAll((done) => {
        done();
    });
    describe('Connect', () => {
        it('should close connection when the protocol is not graphql-ws', (done) => {
            const client = new ws_1.default(`ws://localhost:${serverPort}${server_1.REALTIME_SUBSCRIPTION_PATH}`, 'something');
            client.addEventListener('close', (event) => {
                expect(event.code).toEqual(1002);
                expect(onConnectHandler).not.toHaveBeenCalled();
                done();
            });
        });
        it('should accept connection when the protocol is graphql-ws', async () => {
            const client = new ws_1.default(`ws://localhost:${serverPort}${server_1.REALTIME_SUBSCRIPTION_PATH}`, 'graphql-ws');
            const messagePromise = new Promise((resolve, _) => {
                client.addEventListener('close', (event) => {
                    expect(event.wasClean).toBeTruthy();
                    resolve(undefined);
                });
            });
            await waitForConnection(client);
            client.close();
            expect(onConnectHandler).toHaveBeenCalled();
            return messagePromise;
        });
        it('should call onConnectionHandler with header', async () => {
            const header = {
                Authorization: 'My auth header',
            };
            const query = new url_1.URLSearchParams({
                header: Buffer.from(JSON.stringify(header)).toString('base64'),
            });
            const client = new ws_1.default(`ws://localhost:${serverPort}${server_1.REALTIME_SUBSCRIPTION_PATH}?${query.toString()}`, 'graphql-ws');
            await waitForConnection(client);
            client.close();
            expect(onConnectHandler).toHaveBeenCalled();
            expect(onConnectHandler.mock.calls[0][1]).toEqual(header);
        });
        it('should fail connection when onConnectionHandler throw and error', async () => {
            onConnectHandler.mockRejectedValue('error');
            const client = new ws_1.default(`ws://localhost:${serverPort}${server_1.REALTIME_SUBSCRIPTION_PATH}`, 'graphql-ws');
            const messagePromise = new Promise((resolve, _) => {
                client.addEventListener('close', (event) => {
                    expect(event.code).toEqual(1002);
                    resolve(undefined);
                });
            });
            await waitForConnection(client);
            client.close();
            return messagePromise;
        });
    });
    describe('Connection init', () => {
        let client;
        beforeEach(async () => {
            jest.useFakeTimers();
            const url = new url_1.URL(`ws://localhost:${serverPort}${server_1.REALTIME_SUBSCRIPTION_PATH}`).toString();
            client = new ws_1.default(url, 'graphql-ws');
            await waitForConnection(client);
        });
        afterEach(() => {
            jest.useRealTimers();
        });
        it('should ACK connection', async () => {
            const connectionIntiMessage = {
                type: message_types_1.MESSAGE_TYPES.GQL_CONNECTION_INIT,
                payload: {},
            };
            const messagePromise = new Promise((resolve, _) => {
                client.onmessage = (message) => {
                    const data = JSON.parse(message.data);
                    expect(data.type).toEqual(message_types_1.MESSAGE_TYPES.GQL_CONNECTION_ACK);
                    expect(data.payload.connectionTimeout).toEqual(connectionTimeoutDuration);
                    client.close();
                    resolve(undefined);
                };
            });
            client.send(JSON.stringify(connectionIntiMessage));
            return messagePromise;
        });
        it('should send Error if  the Connection init sends invalid message', async () => {
            const invalidConnectionIntiMessage = {
                type: 'invalid',
                payload: {},
            };
            const messagePromise = new Promise((resolve, _) => {
                client.onmessage = (message) => {
                    const data = JSON.parse(message.data);
                    expect(data.type).toEqual(message_types_1.MESSAGE_TYPES.GQL_ERROR);
                    client.close();
                    resolve(undefined);
                };
            });
            client.send(JSON.stringify(invalidConnectionIntiMessage));
            return messagePromise;
        });
        it('should send KEEP_ALIVE message periodically', async () => {
            const connectionIntiMessage = {
                type: message_types_1.MESSAGE_TYPES.GQL_CONNECTION_INIT,
                payload: {},
            };
            client.send(JSON.stringify(connectionIntiMessage));
            await waitForMessage(client, message_types_1.MESSAGE_TYPES.GQL_CONNECTION_ACK);
            jest.advanceTimersByTime(keepAlive + 1);
            await waitForMessage(client, message_types_1.MESSAGE_TYPES.GQL_CONNECTION_KEEP_ALIVE);
            jest.advanceTimersByTime(keepAlive + 10);
            await waitForMessage(client, message_types_1.MESSAGE_TYPES.GQL_CONNECTION_KEEP_ALIVE);
        });
    });
    describe('Start subscription', () => {
        let client;
        let pubsub;
        let connectionContext;
        const query = `
      subscription onMessage {
        onMessage: String
      }
    `;
        const variables = {
            var1: 'value1',
        };
        const headers = { Authorization: 'authorization headers' };
        const extensions = {
            authorization: headers,
        };
        const id = 'some-unique-id';
        beforeEach(async () => {
            const url = new url_1.URL(`ws://localhost:${serverPort}${server_1.REALTIME_SUBSCRIPTION_PATH}`).toString();
            client = new ws_1.default(url, 'graphql-ws');
            pubsub = new graphql_subscriptions_1.PubSub();
            onConnectHandler.mockImplementation((context) => {
                connectionContext = context;
            });
            await waitForConnection(client);
            const connectionIntiMessage = {
                type: message_types_1.MESSAGE_TYPES.GQL_CONNECTION_INIT,
                payload: {},
            };
            client.send(JSON.stringify(connectionIntiMessage));
            await waitForMessage(client, message_types_1.MESSAGE_TYPES.GQL_CONNECTION_ACK);
        });
        it('should send MESSAGE_TYPES.GQL_START_ACK on when a subscription is stated', async () => {
            const asyncIterator = pubsub.asyncIterator('onMessage');
            onSubscribeHandler.mockReturnValue(asyncIterator);
            const req = JSON.stringify({
                type: message_types_1.MESSAGE_TYPES.GQL_START,
                id,
                payload: {
                    data: JSON.stringify({
                        query,
                        variables,
                    }),
                    extensions,
                },
            });
            client.send(req);
            const msg = await waitForMessage(client, message_types_1.MESSAGE_TYPES.GQL_START_ACK);
            expect(msg.id).toEqual(id);
            expect(onSubscribeHandler).toHaveBeenCalledTimes(1);
            expect(onSubscribeHandler).toHaveBeenCalledWith((0, graphql_1.parse)(query), variables, headers, connectionContext.request);
            expect(connectionContext.subscriptions.get(id)).toEqual({
                id,
                variables,
                document: (0, graphql_1.parse)(query),
                asyncIterator,
            });
        });
        it('should add multiple subscriptions in same connection', async () => {
            const asyncIteratorOne = pubsub.asyncIterator('onMessage');
            const asyncIteratorTwo = pubsub.asyncIterator('onMessageUpdate');
            onSubscribeHandler.mockReturnValueOnce(asyncIteratorOne);
            onSubscribeHandler.mockReturnValueOnce(asyncIteratorTwo);
            const req = {
                type: message_types_1.MESSAGE_TYPES.GQL_START,
                id,
                payload: {
                    data: JSON.stringify({
                        query,
                        variables,
                    }),
                    extensions,
                },
            };
            client.send(JSON.stringify(req));
            const msg = await waitForMessage(client, message_types_1.MESSAGE_TYPES.GQL_START_ACK);
            expect(msg.id).toEqual(id);
            expect(onSubscribeHandler).toHaveBeenCalledTimes(1);
            expect(onSubscribeHandler).toHaveBeenCalledWith((0, graphql_1.parse)(query), variables, headers, connectionContext.request);
            expect(connectionContext.subscriptions.get(id)).toEqual({
                id,
                variables,
                document: (0, graphql_1.parse)(query),
                asyncIterator: asyncIteratorOne,
            });
            const id2 = 'some-id-2';
            client.send(JSON.stringify({ ...req, id: id2 }));
            const msg2 = await waitForMessage(client, message_types_1.MESSAGE_TYPES.GQL_START_ACK);
            expect(msg2.id).toEqual(id2);
            expect(onSubscribeHandler).toHaveBeenCalledTimes(2);
            expect(onSubscribeHandler).toHaveBeenLastCalledWith((0, graphql_1.parse)(query), variables, headers, connectionContext.request);
            expect(connectionContext.subscriptions.size).toEqual(2);
            expect(connectionContext.subscriptions.get(id2)).toEqual({
                id: id2,
                variables,
                document: (0, graphql_1.parse)(query),
                asyncIterator: asyncIteratorTwo,
            });
        });
        it('should return the previous async iterator when same subscription id is used', async () => {
            let iteratorReturnSpy;
            onSubscribeHandler.mockImplementation(() => {
                const iterator = pubsub.asyncIterator('onMessage');
                iteratorReturnSpy = jest.spyOn(iterator, 'return');
                return iterator;
            });
            const payload = JSON.stringify({
                type: message_types_1.MESSAGE_TYPES.GQL_START,
                id,
                payload: {
                    data: JSON.stringify({
                        query,
                        variables,
                    }),
                    extensions,
                },
            });
            client.send(payload);
            await waitForMessage(client, message_types_1.MESSAGE_TYPES.GQL_START_ACK);
            const lastIteratorSpy = iteratorReturnSpy;
            client.send(payload);
            await waitForMessage(client, message_types_1.MESSAGE_TYPES.GQL_START_ACK);
            expect(lastIteratorSpy).toHaveBeenCalled();
        });
        it('should send MESSAGE_TYPES.GQL_ERROR when subscription fails', async () => {
            const error = {
                data: null,
                errors: [{ type: 'Authorization', message: 'You are not authorized' }],
            };
            onSubscribeHandler.mockReturnValue(error);
            const payload = JSON.stringify({
                type: message_types_1.MESSAGE_TYPES.GQL_START,
                id,
                payload: {
                    data: JSON.stringify({
                        query,
                        variables,
                    }),
                    extensions,
                },
            });
            client.send(payload);
            const msg = await waitForMessage(client, message_types_1.MESSAGE_TYPES.GQL_ERROR);
            expect(msg.payload).toEqual(error);
        });
        it('should send MESSAGE_TYPES.GQL_DATA when there is a mutation', async () => {
            const iterator = pubsub.asyncIterator('onMessage');
            onSubscribeHandler.mockReturnValue(iterator);
            const payload = JSON.stringify({
                type: message_types_1.MESSAGE_TYPES.GQL_START,
                id,
                payload: {
                    data: JSON.stringify({
                        query,
                        variables,
                    }),
                    extensions,
                },
            });
            client.send(payload);
            await waitForMessage(client, message_types_1.MESSAGE_TYPES.GQL_START_ACK);
            const data = {
                onMessage: 'hello from iterator',
            };
            pubsub.publish('onMessage', data);
            const msg = await waitForMessage(client, message_types_1.MESSAGE_TYPES.GQL_DATA);
            expect(msg).toEqual({
                type: message_types_1.MESSAGE_TYPES.GQL_DATA,
                id,
                payload: data,
            });
        });
    });
    describe('It should stop subscription when MESSAGE_TYPES.GQL_STOP is sent', () => {
        let client;
        let pubsub;
        let asyncIterator;
        let connectionContext;
        const query = `
      subscription onMessage {
        onMessage: String
      }
    `;
        const variables = {
            var1: 'value1',
        };
        const headers = { Authorization: 'authorization headers' };
        const extensions = {
            authorization: headers,
        };
        const id = 'some-unique-id';
        beforeEach(async () => {
            const url = new url_1.URL(`ws://localhost:${serverPort}${server_1.REALTIME_SUBSCRIPTION_PATH}`).toString();
            client = new ws_1.default(url, 'graphql-ws');
            pubsub = new graphql_subscriptions_1.PubSub();
            asyncIterator = pubsub.asyncIterator('something');
            onSubscribeHandler.mockReturnValue(asyncIterator);
            onConnectHandler.mockImplementation((context) => {
                connectionContext = context;
            });
            await waitForConnection(client);
            const connectionIntiMessage = {
                type: message_types_1.MESSAGE_TYPES.GQL_CONNECTION_INIT,
                payload: {},
            };
            client.send(JSON.stringify(connectionIntiMessage));
            await waitForMessage(client, message_types_1.MESSAGE_TYPES.GQL_CONNECTION_ACK);
            client.send(JSON.stringify({
                type: message_types_1.MESSAGE_TYPES.GQL_START,
                id,
                payload: {
                    data: JSON.stringify({
                        query,
                        variables,
                    }),
                    extensions,
                },
            }));
            await waitForMessage(client, message_types_1.MESSAGE_TYPES.GQL_START_ACK);
        });
        it('should stop subscription', async () => {
            const asyncIteratorReturnSpy = jest.spyOn(asyncIterator, 'return');
            expect(connectionContext.subscriptions.size).toEqual(1);
            expect(connectionContext.subscriptions.get(id)).toEqual({
                id,
                document: (0, graphql_1.parse)(query),
                variables,
                asyncIterator,
            });
            client.send(JSON.stringify({
                type: message_types_1.MESSAGE_TYPES.GQL_STOP,
                id,
            }));
            await waitForMessage(client, message_types_1.MESSAGE_TYPES.GQL_COMPLETE);
            expect(connectionContext.subscriptions.size).toEqual(0);
            expect(asyncIteratorReturnSpy).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=server.test.js.map