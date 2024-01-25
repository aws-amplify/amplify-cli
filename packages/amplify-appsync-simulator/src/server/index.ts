import { OperationServer } from './operations';
import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorServerConfig } from '../type-definition';
import { Server, createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { readFileSync } from 'fs';
import { fromEvent } from 'promise-toolbox';
import { address as getLocalIpAddress } from 'ip';
import { AppSyncSimulatorSubscriptionServer } from './websocket-subscription';
import getPort from 'get-port';
import { REALTIME_SUBSCRIPTION_PATH } from './subscription/websocket-server/server';

const BASE_PORT = 8900;
const MAX_PORT = 9999;

export class AppSyncSimulatorServer {
  private _operationServer: OperationServer;
  private _httpServer: Server;
  private _realTimeSubscriptionServer: AppSyncSimulatorSubscriptionServer;
  private _url: string;
  private _localhostUrl: string;
  private _isHttps = false;

  constructor(private config: AppSyncSimulatorServerConfig, private simulatorContext: AmplifyAppSyncSimulator) {
    this._operationServer = new OperationServer(config, simulatorContext);

    // Check if the SSL key path and certificate path exist and are valid
    if (!config.sslKeyPath || !config.sslCertPath) {
      this._httpServer = createServer(this._operationServer.app);
    } else {
      try {
        // Read the ssl cert and key
        const sslOptions = {
          key: readFileSync(config.sslKeyPath),
          cert: readFileSync(config.sslCertPath),
        };
        // Set the isHttps flag to true
        this._isHttps = true;
        // Create the https server
        this._httpServer = createHttpsServer(sslOptions, this._operationServer.app);
      } catch (e) {
        throw new Error(`SSL key and certificate path provided are invalid. ${e.message}`);
      }
    }

    this._realTimeSubscriptionServer = new AppSyncSimulatorSubscriptionServer(
      simulatorContext,
      this._httpServer,
      REALTIME_SUBSCRIPTION_PATH,
    );
  }

  async start(): Promise<void> {
    let port = this.config.port;

    await this._realTimeSubscriptionServer.start();

    if (!port) {
      port = await getPort({
        port: getPort.makeRange(BASE_PORT, MAX_PORT),
      });
    } else {
      try {
        await getPort({
          port,
        });
      } catch (e) {
        throw new Error(`Port ${port} is already in use. Please kill the program using this port and restart Mock`);
      }
    }

    this._httpServer.listen(port);
    await fromEvent(this._httpServer, 'listening').then(() => {
      const protocol = this._isHttps ? 'https' : 'http';
      this._url = `${protocol}://${getLocalIpAddress()}:${port}`;
      this._localhostUrl = `${protocol}://localhost:${port}`;
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
  get localhostUrl() {
    return {
      graphql: this._localhostUrl,
    };
  }
  get isHttps() {
    return this._isHttps;
  }
}
