import {StorageSimulatorServer} from './server';

export interface StorageSimulatorDataSourceBaseConfig {
  name: string;
  type: string;
}

export type StorageSimulatorServerConfig = {
  port: number;
  wsPort: number;
  route: string;
  localDirS3: string;
};

export class AmplifyStorageSimulator {

  private _server: StorageSimulatorServer;
  private _serverConfig: StorageSimulatorServerConfig;


  constructor(serverConfig: StorageSimulatorServerConfig) {
    this._serverConfig = serverConfig;

    try {
      this._server = new StorageSimulatorServer(serverConfig);
    } catch (e) {
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
    return this._server.url.storage;
  }
  
}

