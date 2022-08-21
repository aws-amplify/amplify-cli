/* eslint-disable class-methods-use-this */
import express from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import { fromEvent } from 'promise-toolbox';
import { EventEmitter } from 'events';
// eslint-disable-next-line import/no-cycle
import { AuthSimulatorServerConfig } from '../index';

const corsOptions = {
  maxAge: 20000,
  exposedHeaders: ['x-amz-server-side-encryption', 'x-amz-request-id', 'x-amz-id-2', 'ETag'],
};
/**
 * Mock Auth Server
 */
export class AuthServer extends EventEmitter {
  private app:express.Application;
  private server;
  private connection;
  private route; // bucket name get from the CFN parser
  url: string;

  private localDirectoryPath: string;

  private async handleRequestPost(req, res): Promise<void> {
    if (req.headers['x-amz-target']) {
      if (req.headers['x-amz-target'] === 'AWSCognitoIdentityProviderService.GetUser') {
        res.set('Content-Type', 'application/json');
        res.send({ userData: { UserAttributes: ['test'] } });
      } else if (req.headers['x-amz-target'] === 'AWSCognitoIdentityProviderService.InitiateAuth') {
        res.set('Content-Type', 'application/json');
        res.send({
          username: 'test',
          AuthenticationResult: { IdToken: 'a', AccessToken: 'b', RefreshToken: 'c' },
          ChallengeParameters: { USER_ID_FOR_SRP: 'test' },
          UserAttributes: [{ username: 'test' }],
        });
      } else {
        res.send('test2');
      }
    } else {
      res.headers.append('Content-Type', 'text/xml');
    }
  }

  constructor(private config: AuthSimulatorServerConfig) {
    super();
    this.localDirectoryPath = config.localDir;
    this.app = express();
    this.app.use(cors(corsOptions));
    // eslint-disable-next-line spellcheck/spell-checker
    this.app.use(bodyParser.raw({ limit: '100mb', type: '*/*' }));
    this.app.post('/', this.handleRequestPost);
    this.server = null;
    this.route = config.route;
  }

  /**
   * Starts the auth mock server
   */
  start(): void {
    if (this.server) {
      throw new Error('Server is already running');
    }
    try {
      this.server = this.app.listen(this.config.port);
    } catch (e) {
      console.log(e);
    }
    return fromEvent(this.server, 'listening').then(() => {
      this.connection = this.server.address();
      this.url = `http://localhost:${this.connection.port}`;
      return this.server;
    });
  }

  /**
   * Stops the auth mock server
   */
  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
      this.connection = null;
    }
  }
}
