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
  private operationServer: OperationServer;
  private subscriptionServer: SubscriptionServer;
  private httpServer: Server;
  private realTimeSubscriptionServer: AppSyncSimulatorSubscriptionServer;

  private _url: string;
  constructor(private config: AppSyncSimulatorServerConfig, private simulatorContext: AmplifyAppSyncSimulator) {
    this.subscriptionServer = new SubscriptionServer(config, simulatorContext);
    this.operationServer = new OperationServer(config, simulatorContext, this.subscriptionServer);
    this.httpServer = createServer(this.operationServer.app);
    this.realTimeSubscriptionServer = new AppSyncSimulatorSubscriptionServer(simulatorContext, this.httpServer, '/graphql');
  }

  async start(): Promise<void> {
    await this.subscriptionServer.start();
    await this.operationServer.start();
    await this.realTimeSubscriptionServer.start();

    let port = this.config.port;
    if (!port) {
      port = await portFinder.getPortPromise({
        startPort: BASE_PORT,
        stopPort: MAX_PORT,
      });
    }

    this.httpServer.listen(port);
    await e2p(this.httpServer, 'listening').then(() => {
      this._url = `http://${getLocalIpAddress()}:${port}`;
    });
  }

  stop() {
    this.operationServer.stop();
    this.subscriptionServer.stop();
    this.realTimeSubscriptionServer.stop();
    this.httpServer.close();
  }
  get url() {
    return {
      graphql: this._url,
    };
  }
}
