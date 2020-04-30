import { OperationServer } from './operations';
import { SubscriptionServer } from './subscription';
import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorServerConfig } from '../type-definition';
import { Server, createServer } from 'http';
import portFinder from 'portfinder';
import e2p from 'event-to-promise';
import { address as getLocalIpAddress } from 'ip';
import { AppSyncSimulatorSubscriptionServer } from './websocket-subscription';

const BASE_PORT = 8900;
const MAX_PORT = 9999;

export class AppSyncSimulatorServer {
  private _operationServer: OperationServer;
  private _subscriptionServer: SubscriptionServer;
  private _httpServer: Server;
  private _realTimeSubscriptionServer: AppSyncSimulatorSubscriptionServer;
  private _url: string;

  constructor(private config: AppSyncSimulatorServerConfig, private simulatorContext: AmplifyAppSyncSimulator) {
    this._subscriptionServer = new SubscriptionServer(config, simulatorContext);
    this._operationServer = new OperationServer(config, simulatorContext, this._subscriptionServer);
    this._httpServer = createServer(this._operationServer.app);
    this._realTimeSubscriptionServer = new AppSyncSimulatorSubscriptionServer(simulatorContext, this._httpServer, '/graphql');
  }

  async start(): Promise<void> {
    let port = this.config.port;

    await this._subscriptionServer.start();
    await this._realTimeSubscriptionServer.start();

    if (!port) {
      port = await portFinder.getPortPromise({
        startPort: BASE_PORT,
        stopPort: MAX_PORT,
        port: BASE_PORT,
      });
    } else {
      try {
        await portFinder.getPortPromise({
          startPort: port,
          stopPort: port,
          port: port,
        });
      } catch (e) {
        throw new Error(`Port ${port} is already in use. Please kill the program using this port and restart Mock`);
      }
    }

    this._httpServer.listen(port);
    await e2p(this._httpServer, 'listening').then(() => {
      this._url = `http://${getLocalIpAddress()}:${port}`;
    });
  }

  stop() {
    this._subscriptionServer.stop();
    this._realTimeSubscriptionServer.stop();
    this._httpServer.close();
  }
  get url() {
    return {
      graphql: this._url,
    };
  }
}
