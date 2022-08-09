/* eslint-disable class-methods-use-this */
import express from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import { fromEvent } from 'promise-toolbox';
import serveStatic from 'serve-static';
import { EventEmitter } from 'events';
// eslint-disable-next-line import/no-cycle
import { AuthSimulatorServerConfig } from '../index';

// import * as util from './utils';

// const LIST_CONTENT = 'Contents';
// const LIST_COMMOM_PREFIXES = 'CommonPrefixes';
// const EVENT_RECORDS = 'Records';
type ServerResponse =
{
test: string;
} & import('http').ServerResponse

type Response= serveStatic.ServeStaticOptions<ServerResponse>
type Request = serveStatic.RequestHandler<ServerResponse>
const corsOptions = {
  maxAge: 20000,
  exposedHeaders: ['x-amz-server-side-encryption', 'x-amz-request-id', 'x-amz-id-2', 'ETag'],
};
/**
 * Mock Auth Server
 */
export class AuthServer extends EventEmitter {
  private app;
  private server;
  private connection;
  private route; // bucket name get from the CFN parser
  url: string;

  private localDirectoryPath: string;

  private async handleRequestGet(request:Request, response:Response) :Promise<void> {
    console.log(request, response);
  }

  private async handleRequestList(request:Request, response:Response):Promise<void> {
    console.log(request, response);
  }

  private async handleRequestDelete(request:Request, response:Response):Promise<void> {
    console.log(request, response);
  }

  private async handleRequestPut(request:Request, response:Response):Promise<void> {
    console.log(request, response);
  }

  private async handleRequestPost(request:Request, response:Response) :Promise<void> {
    console.log(request, response);
  }

  constructor(private config: AuthSimulatorServerConfig) {
    super();
    this.localDirectoryPath = config.localDir;
    this.app = express();
    this.app.use(cors(corsOptions));
    // eslint-disable-next-line spellcheck/spell-checker
    this.app.use(bodyParser.raw({ limit: '100mb', type: '*/*' }));
    //    this.app.use(serveStatic<ServerResponse>(this.localDirectoryPath), this.handleRequestAll.bind(this));

    this.server = null;
    this.route = config.route;
  }

  /**
   * Starts the auth mock server
   */
  start() :void {
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
  stop() :void {
    if (this.server) {
      this.server.close();
      this.server = null;
      this.connection = null;
    }
  }
}
