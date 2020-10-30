import { stateManager } from 'amplify-cli-core';
import { CognitoIdentity } from 'aws-sdk';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { JWK, JWKS, JWT } from 'jose';
import _ from 'lodash';
import fetch from 'node-fetch';

import { TokenPayload, CognitoIdToken, CognitoAccessToken } from '../utils/cognitoJwtTypes';

export class AdminLoginServer {
  private port = 4242; // placeholder
  private app: express.Application;
  private server;
  private appId: string;

  private corsOptions: {
    origin: string[];
    methods: string[];
    allowedHeaders: string;
  };

  constructor(appId: string, originUrl: string, callback: () => void) {
    this.appId = appId;
    this.corsOptions = {
      origin: [originUrl],
      methods: ['POST', 'OPTIONS'],
      allowedHeaders: 'Content-Type',
    };
    this.app = express();
    this.app.use(cors(this.corsOptions));
    this.app.use(bodyParser.json());
    this.setupRoute(callback);
    this.server = this.app.listen(this.getPort());
  }

  // TODO: scan for available ports across a range like mock
  private getPort() {
    return this.port;
  }

  private async getAdminCredentials(idToken: CognitoIdToken, IdentityPoolId: string, region: string): Promise<string> {
    const cognitoIdentity = new CognitoIdentity({ region });
    const login = idToken.payload.iss.replace('https://', '');
    const logins = {
      [login]: idToken.jwtToken,
    };
    const { IdentityId } = await cognitoIdentity
      .getId({
        IdentityPoolId,
        Logins: logins,
      })
      .promise();
    if (!IdentityId) {
      throw new Error('IdentityId not defined. The CLI was unable to retrieve credentials.');
    }
    return IdentityId;
  }

  private async setupRoute(callback) {
    this.app.post('/amplifyadmin/', async (req, res) => {
      try {
        await this.storeTokens(req.body, this.appId);
        delete req.body;
        res.sendStatus(200);
      } catch (e) {
        res.sendStatus(500);
        throw new Error('Failed to receive expected authentication tokens.');
      }
      callback();
    });
  }

  private validateTokens(
    tokens: {
      accessToken: CognitoAccessToken;
      idToken: CognitoIdToken;
    },
    keyStore: JWKS.KeyStore,
  ) {
    const issuer: string = tokens.idToken.payload.iss;
    const audience: string = tokens.idToken.payload.aud;
    const decodedJwtId = JWT.IdToken.verify(tokens.idToken.jwtToken, keyStore, { issuer, audience });
    const decodedJwtAccess = JWT.verify(tokens.accessToken.jwtToken, keyStore);

    return _.isEqual(decodedJwtId, tokens.idToken.payload) && _.isEqual(decodedJwtAccess, tokens.accessToken.payload);
  }

  private async storeTokens(payload: TokenPayload, appId: string) {
    const issuer: string = payload.idToken.payload.iss;
    let keys;
    await fetch(`${issuer}/.well-known/jwks.json`)
      .then(res => res.json())
      .then(json => (keys = json.keys))
      .catch(e => console.error(e));

    const keyStore = new JWKS.KeyStore(keys.map(key => JWK.asKey(key)));
    const areTokensValid = this.validateTokens(
      {
        idToken: payload.idToken,
        accessToken: payload.accessToken,
      },
      keyStore,
    );
    if (areTokensValid) {
      const IdentityId = await this.getAdminCredentials(payload.idToken, payload.IdentityPoolId, payload.region);
      const config = { ...payload, IdentityId };
      stateManager.setAmplifyAdminConfigEntry(appId, config);
    }
  }

  shutdown() {
    this.server.close();
  }
}
