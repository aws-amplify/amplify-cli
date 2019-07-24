import { execute, validate, specifiedRules, parse } from 'graphql';
import * as express from 'express';
import * as cors from 'cors';
import * as jwtDecode from 'jwt-decode';
import { join } from 'path';
import { createServer } from 'https';
import { readFileSync } from 'fs-extra';
import { address as getLocalIpAddress } from 'ip';
import * as e2p from 'event-to-promise';
import * as portfinder from 'portfinder';

import { AppSyncSimulatorServerConfig, AmplifyAppSyncSimulator } from '..';
import { SubscriptionServer } from './subscription';
import { exposeGraphQLErrors } from '../utils/expose-graphql-errors';

const BASE_PORT = 8900;
const MAX_PORT = 9999;

const STATIC_ROOT = join(__dirname, '..', '..','public');
export class OperationServer {
  private app;
  private server;
  private connection;
  private secureKey;
  private secureCert;
  private port: number;
  url: string;

  constructor(
    private config: AppSyncSimulatorServerConfig,
    private simulatorContext: AmplifyAppSyncSimulator,
    private subscriptionServer: SubscriptionServer
  ) {
    this.port = config.port;
    this.app = express();
    this.app.use(express.json());
    this.app.use(cors());
    this.app.post('/graphql', this.handleRequest.bind(this));
    this.app.use('/', express.static(STATIC_ROOT))
    this.server = null;
  }

  async start() {
    if (this.server) {
      throw new Error('Server is already running');
    }

    if(!this.port) {
      this.port = await portfinder.getPortPromise({
        startPort: BASE_PORT,
        stopPort: MAX_PORT
      });
    }

    // this.server = createServer({
    //   cert: this.secureCert,
    //   key: this.secureKey
    // }, this.app).listen(this.config.port);

    this.server = this.app.listen(this.port);

    return await e2p(this.server, 'listening').then(() => {
      this.connection = this.server.address();
      this.url = `http://${getLocalIpAddress()}:${this.connection.port}`
      return this.server;
    })
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
      this.connection = null;
    }
  }

  private async handleRequest(request, response) {
    try {
      const { headers } = request;
      const apiKey = headers['x-api-key'];
      const jwt = headers.authorization ? jwtDecode(headers.authorization) : {};
      if (!apiKey && jwt == {}) {
        throw new Error('Must pass authorization header');
      }
      const { variables = {}, query, operationName } = request.body;
      const doc = parse(query);

      const validationErrors = validate(this.simulatorContext.schema, doc, specifiedRules);
      if (validationErrors.length) {
        return response.send({
          errors: validationErrors
        });
      }
      const {
        definitions: [{ operation: queryType }]
      } = doc as any; // Remove casting

      const context = { jwt, request, appsyncErrors: {} };
      switch (queryType) {
        case 'query':
        case 'mutation':
          const results: any = await execute(
            this.simulatorContext.schema,
            doc,
            null,
            context,
            variables,
            operationName
          );
          if (Object.keys(context.appsyncErrors).length) {
            results.errors = JSON.stringify(context.appsyncErrors);
          }
          // Make extensions available at the root level
          if(results.errors) {
            results.errors = exposeGraphQLErrors(results.errors);
          }
          return response.send({ data: null,...results });

        case 'subscription':
          const result = await execute(
            this.simulatorContext.schema,
            doc,
            null,
            context,
            variables,
            operationName
          );
          const subscription = await this.subscriptionServer.register(doc, variables, context);
          return response.send({
            ...subscription,
            ...result
          })
        default:
          throw new Error(`unknown operation type: ${queryType}`);
      }
    } catch (e) {
      console.log('Error while executing', e);
      return response.send({
        errorMessage: e.message
      });
    }
  }
}
