import cors from 'cors';
import express from 'express';
import { ExecutionResult, parse } from 'graphql';
import { Server } from 'http';
import { join } from 'path';
import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorServerConfig } from '../type-definition';
import { extractHeader, extractJwtToken, getAuthorizationMode } from '../utils/auth-helpers';
import { AppSyncGraphQLExecutionContext } from '../utils/graphql-runner';
import { getOperationType } from '../utils/graphql-runner/helpers';
import { runQueryOrMutation } from '../utils/graphql-runner/query-and-mutation';
import { runSubscription, SubscriptionResult } from '../utils/graphql-runner/subscriptions';
import { AppSyncSimulatorSubscriptionServer } from './websocket-subscription';
import { SubscriptionServer } from './subscription';

const MAX_BODY_SIZE = '10mb';

const STATIC_ROOT = join(__dirname, '..', '..', 'public');
export class OperationServer {
  private _app: express.Application;

  constructor(
    private config: AppSyncSimulatorServerConfig,
    private simulatorContext: AmplifyAppSyncSimulator,
    private subscriptionServer: SubscriptionServer,
  ) {
    this._app = express();
    this._app.use(express.json({ limit: MAX_BODY_SIZE }));
    this._app.use(cors());
    this._app.post('/graphql', this.handleRequest);
    this._app.get('/api-config', this.handleAPIInfoRequest);
    this._app.use('/', express.static(STATIC_ROOT));
  }

  private handleAPIInfoRequest = (request: express.Request, response: express.Response) => {
    return response.send(this.simulatorContext.appSyncConfig);
  };

  private handleRequest = async (request: express.Request, response: express.Response) => {
    try {
      const { headers } = request;
      let requestAuthorizationMode;
      try {
        requestAuthorizationMode = getAuthorizationMode(headers, this.simulatorContext.appSyncConfig);
      } catch (e) {
        return response.status(401).send({
          errors: [
            {
              errorType: 'UnauthorizedException',
              message: e.message,
            },
          ],
        });
      }

      const { variables = {}, query, operationName } = request.body;
      const doc = parse(query);

      if (!this.simulatorContext.schema) {
        return response.send({
          data: null,
          error: 'No schema available',
        });
      }
      const authorization = extractHeader(headers, 'Authorization');
      const jwt = authorization && extractJwtToken(authorization);
      const sourceIp = request.connection.remoteAddress;
      const context: AppSyncGraphQLExecutionContext = {
        jwt,
        requestAuthorizationMode,
        sourceIp,
        headers: request.headers,
        appsyncErrors: [],
      };
      switch (getOperationType(doc, operationName)) {
        case 'query':
        case 'mutation':
          const gqlResult = await runQueryOrMutation(this.simulatorContext.schema, doc, variables, operationName, context);
          return response.send(gqlResult);

        case 'subscription':
          const subscriptionResult = await runSubscription(this.simulatorContext.schema, doc, variables, operationName, context);
          if ((subscriptionResult as ExecutionResult).errors) {
            return response.send(subscriptionResult);
          }
          const subscription = await this.subscriptionServer.register(
            doc,
            variables,
            { ...context, request },
            (subscriptionResult as SubscriptionResult).asyncIterator,
          );
          return response.send({
            ...subscription,
            ...subscriptionResult,
          });
          break;

        default:
          throw new Error(`unknown operation`);
      }
    } catch (e) {
      console.log('Error while executing GraphQL statement', e);
      return response.send({
        errorMessage: e.message,
      });
    }
  };
  get app() {
    return this._app;
  }
}
