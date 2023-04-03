"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSyncSimulatorServer = void 0;
const operations_1 = require("./operations");
const http_1 = require("http");
const promise_toolbox_1 = require("promise-toolbox");
const ip_1 = require("ip");
const websocket_subscription_1 = require("./websocket-subscription");
const get_port_1 = __importDefault(require("get-port"));
const server_1 = require("./subscription/websocket-server/server");
const BASE_PORT = 8900;
const MAX_PORT = 9999;
class AppSyncSimulatorServer {
    constructor(config, simulatorContext) {
        this.config = config;
        this.simulatorContext = simulatorContext;
        this._operationServer = new operations_1.OperationServer(config, simulatorContext);
        this._httpServer = (0, http_1.createServer)(this._operationServer.app);
        this._realTimeSubscriptionServer = new websocket_subscription_1.AppSyncSimulatorSubscriptionServer(simulatorContext, this._httpServer, server_1.REALTIME_SUBSCRIPTION_PATH);
    }
    async start() {
        let port = this.config.port;
        await this._realTimeSubscriptionServer.start();
        if (!port) {
            port = await (0, get_port_1.default)({
                port: get_port_1.default.makeRange(BASE_PORT, MAX_PORT),
            });
        }
        else {
            try {
                await (0, get_port_1.default)({
                    port,
                });
            }
            catch (e) {
                throw new Error(`Port ${port} is already in use. Please kill the program using this port and restart Mock`);
            }
        }
        this._httpServer.listen(port);
        await (0, promise_toolbox_1.fromEvent)(this._httpServer, 'listening').then(() => {
            this._url = `http://${(0, ip_1.address)()}:${port}`;
        });
    }
    async stop() {
        await this._realTimeSubscriptionServer.stop();
        this._httpServer.close();
    }
    get url() {
        return {
            graphql: this._url,
        };
    }
}
exports.AppSyncSimulatorServer = AppSyncSimulatorServer;
//# sourceMappingURL=index.js.map