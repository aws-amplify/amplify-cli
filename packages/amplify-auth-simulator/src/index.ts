// eslint-disable-next-line import/no-cycle
import { AuthServer } from './server/authserver';

/**
 * Config type for the mock auth server
 */
export type AuthSimulatorServerConfig = {
  port: number;
  route: string;
  localDirS3: string;
};

/**
 * Simulates Cognito for mock auth
 */
export class AmplifyAuthSimulator {
  private _server: AuthServer;
  private _serverConfig: AuthSimulatorServerConfig;

  constructor(serverConfig: AuthSimulatorServerConfig) {
    this._serverConfig = serverConfig;

    try {
      this._server = new AuthServer(serverConfig);
    } catch (e) {
      console.log('Mock auth sever failed to start');
      console.log(e);
    }
  }

  /**
   * Start the mock auth server
   */
  async start() :Promise<void> {
    await this._server.start();
  }

  /**
   * Stops the mock auth server
   */
  stop():void {
    this._server.stop();
  }

  /**
   * Returns the url for the mock auth server
   */
  get url():string {
    return this._server.url;
  }

  /**
   * Returns the server object for mock auth
   */
  get getServer() :AuthServer {
    return this._server;
  }
}
