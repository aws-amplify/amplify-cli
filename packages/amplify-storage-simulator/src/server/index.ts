import { StorageServer } from './S3server';

import {StorageSimulatorServerConfig } from '../index';

export  class StorageSimulatorServer {
  private storageServer: StorageServer;


  constructor(config: StorageSimulatorServerConfig) {
    this.storageServer = new StorageServer(config);
  }

  async start() {
    await this.storageServer.start();
  }

  stop() {
    this.storageServer.stop();
  }

  get url() {
    return {
      storage: this.storageServer.url
    };
  }
  
}
