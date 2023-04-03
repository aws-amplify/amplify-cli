"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSyncSimulatorSubscriptionServer = void 0;
const auth_helpers_1 = require("../utils/auth-helpers");
const subscriptions_1 = require("../utils/graphql-runner/subscriptions");
const server_1 = require("./subscription/websocket-server/server");
class AppSyncSimulatorSubscriptionServer {
    constructor(simulatorContext, server, subscriptionPath = server_1.REALTIME_SUBSCRIPTION_PATH) {
        this.simulatorContext = simulatorContext;
        this.server = server;
        this.subscriptionPath = subscriptionPath;
        this.onSubscribe = async (doc, variable, headers, request, operationName) => {
            const ipAddress = request.socket.remoteAddress;
            const authorization = (0, auth_helpers_1.extractHeader)(headers, 'Authorization');
            const jwt = (0, auth_helpers_1.extractJwtToken)(authorization);
            const requestAuthorizationMode = (0, auth_helpers_1.getAuthorizationMode)(headers, this.simulatorContext.appSyncConfig);
            const executionContext = {
                jwt,
                sourceIp: ipAddress,
                headers,
                requestAuthorizationMode,
                appsyncErrors: [],
            };
            const subscriptionResult = await (0, subscriptions_1.runSubscription)(this.simulatorContext.schema, doc, variable, operationName, executionContext);
            if (subscriptionResult.asyncIterator) {
                return subscriptionResult.asyncIterator;
            }
            return subscriptionResult;
        };
        this.onConnect = (message, headers) => {
            this.authorizeRequest(headers);
        };
        this.authorizeRequest = (headers) => {
            return (0, auth_helpers_1.getAuthorizationMode)(headers, this.simulatorContext.appSyncConfig);
        };
        this.onSubscribe = this.onSubscribe.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.realtimeServer = new server_1.WebsocketSubscriptionServer({
            onSubscribeHandler: this.onSubscribe,
            onConnectHandler: this.onConnect,
        }, {
            server: this.server,
            path: this.subscriptionPath,
        });
    }
    start() {
        this.realtimeServer.start();
    }
    async stop() {
        await this.realtimeServer.stop();
    }
}
exports.AppSyncSimulatorSubscriptionServer = AppSyncSimulatorSubscriptionServer;
//# sourceMappingURL=websocket-subscription.js.map