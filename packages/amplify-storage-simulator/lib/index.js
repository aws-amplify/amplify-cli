"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifyStorageSimulator = void 0;
const S3server_1 = require("./server/S3server");
class AmplifyStorageSimulator {
    constructor(serverConfig) {
        this._serverConfig = serverConfig;
        try {
            this._server = new S3server_1.StorageServer(serverConfig);
        }
        catch (e) {
            console.log('Mock storage sever failed to start');
            console.log(e);
        }
    }
    async start() {
        await this._server.start();
    }
    stop() {
        this._server.stop();
    }
    get url() {
        return this._server.url;
    }
    get getServer() {
        return this._server;
    }
}
exports.AmplifyStorageSimulator = AmplifyStorageSimulator;
//# sourceMappingURL=index.js.map