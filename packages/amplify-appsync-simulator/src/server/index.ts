import { OperationServer } from './operations';
import { SubscriptionServer } from './subscription';
import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorServerConfig } from '../type-definition';

export class AppSyncSimulatorServer {
  private operationServer: OperationServer;
  private subscriptionServer: SubscriptionServer;

  constructor(config: AppSyncSimulatorServerConfig, simulatorContext: AmplifyAppSyncSimulator) {
    this.subscriptionServer = new SubscriptionServer(config, simulatorContext);
    this.operationServer = new OperationServer(config, simulatorContext, this.subscriptionServer);
  }
  async start() {
    await this.subscriptionServer.start();
    await this.operationServer.start();
  }
  stop() {
    this.operationServer.stop();
    this.subscriptionServer.stop();
  }
  get url() {
    return {
      graphql: this.operationServer.url,
      subscription: this.subscriptionServer.url,
    };
  }
}
