"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketSubscriptionServer = exports.REALTIME_SUBSCRIPTION_PATH = void 0;
const graphql_1 = require("graphql");
const WebSocket = __importStar(require("ws"));
const ws_1 = require("ws");
const message_type_guards_1 = require("./message-type-guards");
const message_types_1 = require("./message-types");
const utils_1 = require("./utils");
exports.REALTIME_SUBSCRIPTION_PATH = '/graphql/realtime';
const PROTOCOL = 'graphql-ws';
const KEEP_ALIVE_TIMEOUT = 4 * 60 * 1000;
const CONNECTION_TIMEOUT_DURATION = 5 * 60 * 1000;
const DEFAULT_OPTIONS = {
    onConnectHandler: async () => {
    },
    keepAlive: KEEP_ALIVE_TIMEOUT,
    connectionTimeoutDuration: CONNECTION_TIMEOUT_DURATION,
};
class WebsocketSubscriptionServer {
    constructor(options, server) {
        this.onClose = async (connectionContext) => {
            for (const subscription of Array.from(connectionContext.subscriptions.values())) {
                await this.stopAsyncIterator(connectionContext, subscription.id);
            }
            if (connectionContext.pingIntervalHandle) {
                clearInterval(connectionContext.pingIntervalHandle);
                connectionContext.pingIntervalHandle = null;
            }
            this.connections.delete(connectionContext);
        };
        this.onUnsubscribe = async (connectionContext, messageOrSubscriptionId) => {
            const { id } = messageOrSubscriptionId;
            await this.stopAsyncIterator(connectionContext, id);
            this.sendMessage(connectionContext, id, message_types_1.MESSAGE_TYPES.GQL_COMPLETE, {});
        };
        this.stopAsyncIterator = async (connectionContext, id) => {
            if (connectionContext.subscriptions && connectionContext.subscriptions.has(id)) {
                const subscription = connectionContext.subscriptions.get(id);
                if (subscription.asyncIterator) {
                    await subscription.asyncIterator.return();
                }
                connectionContext.subscriptions.delete(id);
            }
        };
        this.onSocketConnection = async (socket, request) => {
            socket.upgradeReq = request;
            try {
                if (typeof socket.protocol === 'undefined' || socket.protocol !== PROTOCOL) {
                    throw new Error('Invalid protocol');
                }
                const connectionContext = {
                    request,
                    socket,
                    subscriptions: new Map(),
                    isConnectionInitialized: false,
                };
                const headers = (0, utils_1.decodeHeaderFromQueryParam)(request.url);
                await this.options.onConnectHandler(connectionContext, headers);
                this.connections.add(connectionContext);
                const onMessage = (message) => {
                    void this.onMessage(connectionContext, message);
                };
                const onClose = async (error) => {
                    socket.off('message', onMessage);
                    socket.off('close', onClose);
                    socket.off('error', onClose);
                    await this.onSocketDisconnection(connectionContext, error);
                };
                socket.on('message', onMessage);
                socket.on('close', onClose);
                socket.on('error', onClose);
            }
            catch (e) {
                socket.close(1002);
                return;
            }
        };
        this.onSocketDisconnection = async (connectionContext, error) => {
            await this.onClose(connectionContext);
            if (error) {
                this.sendError(connectionContext, '', { message: error instanceof Error ? error.message : error });
                setTimeout(() => {
                    connectionContext.socket.close(1011);
                }, 10);
            }
        };
        this.onMessage = (connectionContext, rawMessage) => {
            const message = JSON.parse(rawMessage);
            try {
                switch (message.type) {
                    case message_types_1.MESSAGE_TYPES.GQL_CONNECTION_INIT:
                        if ((0, message_type_guards_1.isSubscriptionConnectionInitMessage)(message)) {
                            return this.onConnectionInit(connectionContext);
                        }
                        break;
                    case message_types_1.MESSAGE_TYPES.GQL_START:
                        if ((0, message_type_guards_1.isSubscriptionStartMessage)(message)) {
                            return this.onSubscriptionStart(connectionContext, message);
                        }
                        break;
                    case message_types_1.MESSAGE_TYPES.GQL_STOP:
                        if ((0, message_type_guards_1.isSubscriptionStopMessage)(message)) {
                            return this.onUnsubscribe(connectionContext, message);
                        }
                }
                throw new Error('Invalid message');
            }
            catch (e) {
                this.sendError(connectionContext, '', { errors: [{ message: e.message }] });
            }
            return undefined;
        };
        this.sendMessage = (connectionContext, subscriptionId, type, data) => {
            const message = {
                type,
                id: subscriptionId,
                payload: data,
            };
            if (connectionContext.socket.readyState === WebSocket.OPEN) {
                connectionContext.socket.send(JSON.stringify(message));
            }
        };
        this.sendError = (connectionContext, subscriptionId, errorPayload, type = message_types_1.MESSAGE_TYPES.GQL_ERROR) => {
            if ([message_types_1.MESSAGE_TYPES.GQL_CONNECTION_ERROR, message_types_1.MESSAGE_TYPES.GQL_ERROR].indexOf(type) === -1) {
                throw new Error(`Message type should for error should be one of ${message_types_1.MESSAGE_TYPES.GQL_ERROR} or ${message_types_1.MESSAGE_TYPES.GQL_CONNECTION_ERROR}`);
            }
            this.sendMessage(connectionContext, subscriptionId, type, errorPayload);
        };
        this.setupPing = (connectionContext) => {
            connectionContext.pingIntervalHandle = setInterval(() => {
                this.sendMessage(connectionContext, undefined, message_types_1.MESSAGE_TYPES.GQL_CONNECTION_KEEP_ALIVE, undefined);
            }, this.options.keepAlive);
        };
        this.onConnectionInit = (connectionContext) => {
            connectionContext.isConnectionInitialized = true;
            const response = {
                type: message_types_1.MESSAGE_TYPES.GQL_CONNECTION_ACK,
                payload: {
                    connectionTimeout: this.options.connectionTimeoutDuration,
                },
            };
            this.sendMessage(connectionContext, undefined, response.type, response.payload);
            this.setupPing(connectionContext);
            this.setupPing(connectionContext);
        };
        this.onSubscriptionStart = async (connectionContext, message) => {
            const id = message.id;
            const data = JSON.parse(message.payload.data);
            const query = (0, graphql_1.parse)(data.query);
            const variables = data.variables;
            const headers = message.payload.extensions.authorization;
            if (connectionContext.subscriptions && connectionContext.subscriptions.has(id)) {
                await this.stopAsyncIterator(connectionContext, id);
            }
            const asyncIterator = await this.options.onSubscribeHandler(query, variables, headers, connectionContext.request);
            if (asyncIterator.errors) {
                const error = {
                    errors: asyncIterator.errors,
                    data: asyncIterator.data || null,
                };
                this.sendError(connectionContext, id, error, message_types_1.MESSAGE_TYPES.GQL_ERROR);
            }
            else {
                const subscription = {
                    id,
                    asyncIterator: asyncIterator,
                    document: query,
                    variables,
                };
                connectionContext.subscriptions.set(id, subscription);
                this.sendMessage(connectionContext, id, message_types_1.MESSAGE_TYPES.GQL_START_ACK, {});
                await this.attachAsyncIterator(connectionContext, subscription);
            }
        };
        this.attachAsyncIterator = async (connectionContext, sub) => {
            const { asyncIterator, id } = sub;
            let done = false;
            do {
                const { value, done: doneResult } = await asyncIterator.next();
                done = doneResult;
                if (done) {
                    break;
                }
                this.sendMessage(connectionContext, id, message_types_1.MESSAGE_TYPES.GQL_DATA, value);
            } while (!done);
        };
        this.connections = new Set();
        this.options = { ...DEFAULT_OPTIONS, ...options };
        if (server) {
            this.attachWebServer(server);
        }
    }
    attachWebServer(serverOptions) {
        this.webSocketServer = new ws_1.Server({ ...serverOptions, path: exports.REALTIME_SUBSCRIPTION_PATH });
    }
    start() {
        if (!this.webSocketServer) {
            throw new Error('No server is attached');
        }
        this.webSocketServer.on('connection', this.onSocketConnection);
    }
    async stop() {
        var _a, _b;
        (_a = this.webSocketServer) === null || _a === void 0 ? void 0 : _a.off('connection', this.onSocketConnection);
        for (const connection of Array.from(this.connections)) {
            await this.onClose(connection);
        }
        (_b = this.webSocketServer) === null || _b === void 0 ? void 0 : _b.close();
    }
}
exports.WebsocketSubscriptionServer = WebsocketSubscriptionServer;
//# sourceMappingURL=server.js.map