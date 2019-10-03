import { StorageServer } from "./server/S3server";

export interface StorageSimulatorDataSourceBaseConfig {
  name: string;
  type: string;
}

export type StorageSimulatorServerConfig = {
  port: number;
  route: string;
  localDirS3: string;
};

export class AmplifyStorageSimulator {
  private _server: StorageServer;
  private _serverConfig: StorageSimulatorServerConfig;

  constructor(serverConfig: StorageSimulatorServerConfig) {
    this._serverConfig = serverConfig;

    try {
      this._server = new StorageServer(serverConfig);
    } catch (e) {
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
