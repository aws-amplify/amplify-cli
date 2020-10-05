import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import { JSONUtilities, pathManager } from 'amplify-cli-core';
import { getAdminCredentials } from 'amplify-provider-awscloudformation';

interface TokenPayload {
  accessToken: string;
  clockDrift: number;
  idToken: string;
  refreshToken: string;
  region: string;
}

export class AdminLoginServer {
  private port = 4242; // placeholder
  private app: express.Application;
  private server;
  private appId: string;

  constructor(appId, callback) {
    this.appId = appId;
    this.app = express();
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.setupRoute(callback);
    this.server = this.app.listen(this.getPort(), () => console.log(`listening on port ${this.getPort()}`));
  }

  // Todo: scan for available ports across a range like mock
  private getPort() {
    return this.port;
  }

  setupRoute(callback) {
    this.app.post('/amplifyadmin/', (req, res) => {
      console.log('Tokens received');
      this.storeTokens(req.body, this.appId);
      delete req.body;
      res.sendStatus(200);
      callback();
    });
  }

  storeTokens(payload: TokenPayload, appId: string) {
    const config: { [key: string]: TokenPayload } =
      JSONUtilities.readJson(pathManager.getAmplifyAdminConfigFilePath(), { throwIfNotExist: false }) || {};
    // TODO: validate payload
    config[appId] = payload;
    JSONUtilities.writeJson(pathManager.getAmplifyAdminConfigFilePath(), config, { secureFile: true });
    getAdminCredentials(payload.idToken);
  }

  shutdown() {
    this.server.close();
  }
}
