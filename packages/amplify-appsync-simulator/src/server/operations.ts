import * as cors from 'cors';
import * as e2p from 'event-to-promise';
import * as express from 'express';
import { execute, parse, specifiedRules, validate } from 'graphql';
import * as jwtDecode from 'jwt-decode';
import { join } from 'path';
import * as portfinder from 'portfinder';
import { address as getLocalIpAddress } from 'ip';
import { AmplifyAppSyncSimulator } from '..';
import { AmplifyAppSyncSimulatorAuthenticationType, AppSyncSimulatorServerConfig } from '../type-definition';
import { exposeGraphQLErrors } from '../utils/expose-graphql-errors';
import { SubscriptionServer } from './subscription';


const BASE_PORT = 8900;
const MAX_PORT = 9999;

const STATIC_ROOT = join(__dirname, '..', '..', 'public');
export class OperationServer {
  private app;
  private server;
  private connection;
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
    this.app.get('/api-config', this.handleAPIInfoRequest.bind(this));
    this.app.use('/', express.static(STATIC_ROOT));
    this.server = null;
  }

  async start() {
    if (this.server) {
      throw new Error('Server is already running');
    }

    if (!this.port) {
      this.port = await portfinder.getPortPromise({
        startPort: BASE_PORT,
        stopPort: MAX_PORT,
      });
    }

    this.server = this.app.listen(this.port);

    return await e2p(this.server, 'listening').then(() => {
      this.connection = this.server.address();
      this.url = `http://${getLocalIpAddress()}:${this.connection.port}`;
      return this.server;
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
      this.connection = null;
    }
  }

  private handleAPIInfoRequest(request, response) {
    return response.send(this.simulatorContext.appSyncConfig);
  }

  private async handleRequest(request, response) {
    try {
      const appSyncConfig = this.simulatorContext.appSyncConfig;
      const { headers } = request;
      const apiKey = headers['x-api-key'];

      const authorization = headers.Authorization || headers.authorization;
      const jwt = authorization ? jwtDecode(authorization) : {};
      if (appSyncConfig.authenticationType === AmplifyAppSyncSimulatorAuthenticationType.API_KEY) {
        let error = {
          errorType: 'UnauthorizedException',
          message: '',
        };
        if (!apiKey) {
          error.message = 'Missing authorization header';
          return response.status(401).send(error);
        }
        if (apiKey !== appSyncConfig.apiKey) {
          error.message = 'You are not authorized to make this call.';
          return response.status(401).send(error);
        }
      } else if (
        appSyncConfig.authenticationType ===
          AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS ||
        appSyncConfig.authenticationType == AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT
      ) {
        if (Object.keys(jwt).length === 0) {
          return response.status(401).send({
            errors: [
              {
                errorType: 'UnauthorizedException',
                message: 'Unauthorized',
              },
            ],
          });
        }
      }

      const { variables = {}, query, operationName } = request.body;
      const doc = parse(query);

      if (!this.simulatorContext.schema) {
        return response.send({
          data: null,
          error: 'No schema available',
        });
      }
      const validationErrors = validate(this.simulatorContext.schema, doc, specifiedRules);
      if (validationErrors.length) {
        return response.send({
          errors: validationErrors,
        });
      }
      const {
        definitions: [{ operation: queryType }],
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
          if (results.errors) {
            results.errors = exposeGraphQLErrors(results.errors);
          }
          return response.send({ data: null, ...results });

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
            ...result,
          });
        default:
          throw new Error(`unknown operation type: ${queryType}`);
      }
    } catch (e) {
      console.log('Error while executing GraphQL statement', e);
      return response.send({
        errorMessage: e.message,
      });
    }
  }
}
