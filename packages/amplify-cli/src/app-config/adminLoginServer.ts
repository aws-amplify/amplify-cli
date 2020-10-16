import { CognitoIdentity } from 'aws-sdk';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
// import { JWT } from 'jose';
import { JSONUtilities, pathManager } from 'amplify-cli-core';

// TODO, type info
interface TokenPayload {
  accessToken: any;
  clockDrift: number;
  idToken: any;
  refreshToken: any;
  region: string;
}

export class AdminLoginServer {
  private port = 4242; // placeholder
  private app: express.Application;
  private server;
  private appId: string;

  private corsOptions = {
    origin: ['http://localhost:3000'],
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: 'Content-Type',
  };

  constructor(appId: string, callback: () => void) {
    this.appId = appId;
    this.app = express();
    this.app.use(cors(this.corsOptions));
    this.app.use(bodyParser.json());
    this.setupRoute(callback);
    this.server = this.app.listen(this.getPort(), () => console.log(`listening on port ${this.getPort()}`));
  }

  // Todo: scan for available ports across a range like mock
  private getPort() {
    return this.port;
  }

  private getAdminCredentials(idToken: any, region: string, callback: (err: any, data: any) => void) {
    const cognitoIdentity = new CognitoIdentity({ region });
    const logins = {
      [idToken.payload.iss]: idToken.jwtToken,
    };
    cognitoIdentity.getId(
      {
        IdentityPoolId: `TODO: Identity pool here`,
        Logins: logins,
      },
      (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log(data);
        const { IdentityId } = data;
        if (IdentityId) {
          cognitoIdentity.getCredentialsForIdentity(
            {
              IdentityId,
              Logins: logins,
            },
            callback,
          );
        } else {
          console.error('IdentityId not defined. The CLI was unable to retrieve credentials.');
        }
      },
    );
  }

  private setupRoute(callback: () => void) {
    this.app.post('/amplifyadmin/', (req, res) => {
      console.log('Tokens received');
      this.storeTokens(req.body, this.appId);
      delete req.body;
      res.sendStatus(200);
      callback();
    });
  }

  private storeTokens(payload: TokenPayload, appId: string) {
    const config: { [key: string]: TokenPayload } =
      JSONUtilities.readJson(pathManager.getAmplifyAdminConfigFilePath(), { throwIfNotExist: false }) || {};
    // TODO: validate payload - strip excess token data from react app
    config[appId] = payload;
    JSONUtilities.writeJson(pathManager.getAmplifyAdminConfigFilePath(), config, { secureFile: true });
    console.log(payload);
    // const retVal = JWT.verify(payload.accessToken.jwtToken, );
    // console.log(retVal);
    this.getAdminCredentials(payload.idToken, payload.region, (err, data) => {
      if (err) console.error('Failed to get AWS credentials:', err);
      console.log(data);
    });
  }

  shutdown() {
    this.server.close();
  }
}
