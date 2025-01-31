import { AmplifyError, stateManager } from '@aws-amplify/amplify-cli-core';
import * as assert from 'assert';
import { CognitoIdentity } from 'aws-sdk';
import bodyParser from 'body-parser'; // eslint-disable-line
import cors from 'cors';
import express from 'express'; // eslint-disable-line
import http from 'http';
import * as jose from 'jose';
import _ from 'lodash';

import { Printer } from '@aws-amplify/amplify-prompts';
import { AdminAuthPayload, CognitoAccessToken, CognitoIdToken } from './auth-types';

/**
 * Admin login server class
 */
export class AdminLoginServer {
  private app: express.Application;
  private appId: string;
  private port = 4242; // placeholder
  private server: http.Server;
  private print: Printer;
  private host = '0.0.0.0'; // using this ip address for the host forces express to listen on IPV4 even if IPV6 is available

  private corsOptions: {
    origin: string[];
    methods: string[];
    allowedHeaders: string;
  };

  constructor(appId: string, originUrl: string, print: Printer) {
    this.appId = appId;
    this.corsOptions = {
      origin: [originUrl],
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: 'Content-Type',
    };
    this.print = print;
    this.app = express();
    this.app.use(cors(this.corsOptions));
    this.app.use(bodyParser.json());
  }

  /**
   * Sets up express server to listen for tokens
   */
  public async startServer(callback: () => void): Promise<void> {
    await this.setupRoute(callback);
    // Need to specify hostname for WSL
    this.server = this.app.listen(this.getPort(), this.getHost());
  }

  private getHost(): string {
    return this.host;
  }

  // TODO: scan for available ports across a range like mock
  private getPort(): number {
    return this.port;
  }

  private async getIdentityId(idToken: CognitoIdToken, IdentityPoolId: string, region: string): Promise<string> {
    // eslint-disable-line
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
      throw new AmplifyError('AmplifyStudioLoginError', {
        message: 'IdentityId not defined. Amplify CLI was unable to retrieve credentials.',
      });
    }
    return IdentityId;
  }

  private async setupRoute(callback): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.app.post('/amplifyadmin/', async (req, res) => {
      if (!req.body || req.body.error) {
        this.shutdown();
        if (req.body.error === 'CANCELLED') {
          this.print.info('Login canceled');
          process.exit(0);
        }
        throw new AmplifyError('AmplifyStudioLoginError', {
          message: 'Failed to receive expected authentication tokens.',
        });
      }
      try {
        await this.storeTokens(req.body, this.appId);
        delete req.body;
        res.sendStatus(200);
      } catch (err) {
        res.sendStatus(500).send({
          errorName: 'AmplifyStudioLoginError',
          errorMessage: `Failed to receive expected authentication tokens. Error: ${err}`,
        });
        throw new AmplifyError(
          'AmplifyStudioLoginError',
          {
            message: `Failed to receive expected authentication tokens. Error: [${err}]`,
          },
          err,
        );
      }
      callback();
    });
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.app.get('/ping', async (_, res) => {
      res.send({ success: true });
    });
  }

  private async validateTokens(
    // eslint-disable-line
    tokens: {
      accessToken: CognitoAccessToken;
      idToken: CognitoIdToken;
    },
  ): Promise<boolean> {
    const issuer: string = tokens.idToken.payload.iss;
    const audience: string = tokens.idToken.payload.aud;

    const N_JWKS = jose.createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

    const { payload: decodedJwtId } = await jose.jwtVerify(tokens.idToken.jwtToken, N_JWKS, { issuer, audience });
    if (Array.isArray(decodedJwtId.aud) && decodedJwtId.aud.length > 1) {
      assert.strictEqual(decodedJwtId.azp, audience); // checking mandatory presence as per the ID Token profile
    }
    assert.ok(typeof decodedJwtId.sub === 'string' && decodedJwtId.sub);
    assert.ok('iat' in decodedJwtId); // checking mandatory presence
    assert.ok('exp' in decodedJwtId); // checking mandatory presence, when present it was already validated

    const { payload: decodedJwtAccess } = await jose.jwtVerify(tokens.accessToken.jwtToken, N_JWKS);

    return _.isEqual(decodedJwtId, tokens.idToken.payload) && _.isEqual(decodedJwtAccess, tokens.accessToken.payload);
  }

  /**
   * Stores tokens received by server
   */
  public async storeTokens(payload: AdminAuthPayload, appId: string): Promise<void> {
    const areTokensValid = await this.validateTokens({
      idToken: payload.idToken,
      accessToken: payload.accessToken,
    });
    if (areTokensValid) {
      const IdentityId = await this.getIdentityId(payload.idToken, payload.IdentityPoolId, payload.region);
      const config = { ...payload, IdentityId };
      stateManager.setAmplifyAdminConfigEntry(appId, config);
    }
  }

  /**
   * Shuts down the server
   */
  shutdown(): void {
    this.server.close();
  }
}
