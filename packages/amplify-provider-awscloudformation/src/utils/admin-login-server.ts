import { $TSContext, stateManager } from 'amplify-cli-core';
import { CognitoIdentity } from 'aws-sdk';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import http from 'http';
import { JWK, JWKS, JWT } from 'jose';
import _ from 'lodash';
import fetch from 'node-fetch';

import { AdminAuthPayload, CognitoIdToken, CognitoAccessToken } from './auth-types';

export class AdminLoginServer {
  private app: express.Application;
  private appId: string;
  private port = 4242; // placeholder
  private server: http.Server;
  private print: $TSContext['print'];
  private host = '0.0.0.0'; // using this ip address for the host forces express to listen on IPV4 even if IPV6 is available

  private corsOptions: {
    origin: string[];
    methods: string[];
    allowedHeaders: string;
  };

  constructor(appId: string, originUrl: string, print: $TSContext['print']) {
    this.appId = appId;
    this.corsOptions = {
      origin: [originUrl],
      methods: ['POST', 'OPTIONS'],
      allowedHeaders: 'Content-Type',
    };
    this.print = print;
    this.app = express();
    this.app.use(cors(this.corsOptions));
    this.app.use(bodyParser.json());
  }

  public async startServer(callback: () => void) {
    await this.setupRoute(callback);
    // Need to specify hostname for WSL
    this.server = this.app.listen(this.getPort(), this.getHost());
  }

  private getHost() {
    return this.host;
  }

  // TODO: scan for available ports across a range like mock
  private getPort() {
    return this.port;
  }

  private async getIdentityId(idToken: CognitoIdToken, IdentityPoolId: string, region: string): Promise<string> {
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
      throw new Error('IdentityId not defined. Amplify CLI was unable to retrieve credentials.');
    }
    return IdentityId;
  }

  private async setupRoute(callback) {
    this.app.post('/amplifyadmin/', async (req, res) => {
      if (!req.body || req.body.error) {
        this.shutdown();
        if (req.body.error === 'CANCELLED') {
          this.print.info('Login cancelled');
          process.exit(0);
        }
        throw new Error('Failed to receive expected authentication tokens.');
      }
      try {
        await this.storeTokens(req.body, this.appId);
        delete req.body;
        res.sendStatus(200);
      } catch (err) {
        res.sendStatus(500);
        throw new Error(`Failed to receive expected authentication tokens. Error: [${err}]`);
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

  private async storeTokens(payload: AdminAuthPayload, appId: string) {
    const issuer: string = payload.idToken.payload.iss;
    const res = await fetch(`${issuer}/.well-known/jwks.json`);
    const { keys } = await res.json();

    const keyStore = new JWKS.KeyStore(keys.map(key => JWK.asKey(key)));
    const areTokensValid = this.validateTokens(
      {
        idToken: payload.idToken,
        accessToken: payload.accessToken,
      },
      keyStore,
    );
    if (areTokensValid) {
      const IdentityId = await this.getIdentityId(payload.idToken, payload.IdentityPoolId, payload.region);
      const config = { ...payload, IdentityId };
      stateManager.setAmplifyAdminConfigEntry(appId, config);
    }
  }

  shutdown() {
    this.server.close();
  }
}
