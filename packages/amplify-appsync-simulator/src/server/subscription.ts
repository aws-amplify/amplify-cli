import { subscribe, DocumentNode, ExecutionResult } from 'graphql';
import crypto from 'crypto';
import { inspect } from 'util';
import { createServer as createHTTPServer } from 'http';
import e2p from 'event-to-promise';
import portfinder from 'portfinder';
import chalk from 'chalk';

import { Server as CoreHTTPServer, AddressInfo } from 'net';
import { Server as MQTTServer } from '../mqtt-server';
import { address as getLocalIpAddress } from 'ip';

import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorServerConfig } from '../type-definition';

const MINUTE = 1000 * 60;
const CONNECTION_TIME_OUT = 2 * MINUTE; // 2 mins
const TOPIC_EXPIRATION_TIMEOUT = 60 * MINUTE; // 60 mins
const BASE_PORT = 8900;
const MAX_PORT = 9999;

const log = console;

export class SubscriptionServer {
  private registrations;
  private iteratorTimeout: Map<string, NodeJS.Timer>;
  private webSocketServer: CoreHTTPServer;
  private mqttServer;
  url: string;
  private port: number;
  private publishingTopics: Set<string>;

  constructor(private config: AppSyncSimulatorServerConfig, private appSyncServerContext: AmplifyAppSyncSimulator) {
    this.port = config.wsPort;
    this.webSocketServer = createHTTPServer();

    this.mqttServer = new MQTTServer({
      logger: {
        level: process.env.DEBUG ? 'debug' : 'error',
      },
    });
    this.mqttServer.attachHttpServer(this.webSocketServer);
    this.registrations = new Map();
    this.iteratorTimeout = new Map();
    this.publishingTopics = new Set();

    this.mqttServer.on('clientConnected', this.afterClientConnect.bind(this));

    this.mqttServer.on('clientDisconnected', this.afterDisconnect.bind(this));

    this.mqttServer.on('subscribed', this.afterSubscription.bind(this));

    this.mqttServer.on('unsubscribed', this.afterUnsubscribe.bind(this));
  }

  async start() {
    if (!this.port) {
      this.port = await portfinder.getPortPromise({
        startPort: BASE_PORT,
        stopPort: MAX_PORT,
      });
    }
    const server = this.webSocketServer.listen(this.port);
    return await e2p(server, 'listening').then(() => {
      const address = server.address() as AddressInfo;
      this.url = `ws://${getLocalIpAddress()}:${address.port}/`;
      return server;
    });
  }

  stop() {
    if (this.webSocketServer) {
      this.webSocketServer.close();
      this.url = null;
      this.webSocketServer = null;
    }
  }

  async afterClientConnect(client) {
    const { id: clientId } = client;
    log.info(`Client (${chalk.bold(clientId)}) connected to subscription server`);
    const timeout = this.iteratorTimeout.get(client.id);
    if (timeout) {
      clearTimeout(timeout);
    }
  }

  async afterSubscription(topic, client) {
    const { id: clientId } = client;
    log.info(`Client (${chalk.bold(clientId)}) subscribed to topic ${topic}`);
    const regs = this.registrations.get(clientId);
    if (!regs) {
      log.error(`No registration for client (${chalk.bold(clientId)})`);
      return;
    }

    const reg = regs.find(({ topicId }) => topicId === topic);
    if (!reg) {
      log.error(`Client (${chalk.bold(clientId)}) tried to subscribe to non-existent topic ${topic}`);
      return;
    }

    if (!reg.isRegistered) {
      const asyncIterator = await this.subscribeToGraphQL(reg.documentAST, reg.variables, reg.context);

      if ((asyncIterator as ExecutionResult).errors) {
        log.error('Error(s) subscribing via GraphQL', (asyncIterator as ExecutionResult).errors);
        return;
      }

      Object.assign(reg, {
        asyncIterator,
        isRegistered: true,
      });
    }

    const { asyncIterator, topicId, variables } = reg;

    while (true) {
      let { value: payload } = await asyncIterator.next();
      if (!this.shouldPublishSubscription(payload, variables)) {
        continue;
      }

      log.info(`Publishing payload for topic ${topicId}`);
      log.log('Payload:');
      log.log(inspect(payload));
      this.mqttServer.publish({
        topic: topicId,
        payload: JSON.stringify(payload),
        qos: 0,
        retain: false,
      });
    }
  }

  afterUnsubscribe(topic, client) {
    const { id: clientId } = client;
    log.info(`Client (${chalk.bold(clientId)}) unsubscribed from topic ${topic}`);
    const regs = this.registrations.get(clientId);
    if (!regs) {
      log.error(`No registration for client (${chalk.bold(clientId)})`);
      return;
    }

    const reg = regs.find(({ topicId }) => topicId === topic);
    if (!reg) {
      log.error(`Client (${chalk.bold(clientId)}) tried to unsubscribe from non-existent topic ${topic}`);
      return;
    }

    // turn off subscription, but keep registration so client
    // can resubscribe
    reg.asyncIterator.return();
    reg.isRegistered = false;
  }

  afterDisconnect(client) {
    const { id: clientId } = client;
    log.info(`Client (${chalk.bold(clientId)}) disconnected`);
    const reg = this.registrations.get(clientId);
    if (!reg) {
      log.error(`Unregistered client (${chalk.bold(clientId)}) disconnected`);
    }
  }

  async register(documentAST, variables, context) {
    const connection = context.request.connection;
    const remoteAddress = `${connection.remoteAddress}:${connection.remotePort}`;
    const clientId = crypto
      .createHash('MD5')
      .update(remoteAddress)
      .digest()
      .toString('hex');

    const subscriptionName = documentAST.definitions[0].selectionSet.selections[0].name.value;
    const paramHash =
      variables && Object.keys(variables).length
        ? crypto
            .createHash('MD5')
            .update(JSON.stringify(variables))
            .digest()
            .toString('hex')
        : null;
    const topicId = [clientId, subscriptionName, paramHash].join('/');

    log.info(`Client (${chalk.bold(clientId)}) registered for topic ${topicId}`);

    const registration = {
      context,
      documentAST,
      variables,
      topicId,
    };
    const asyncIterator = await this.subscribeToGraphQL(documentAST, variables, context);

    if ((asyncIterator as ExecutionResult).errors) {
      return {
        errors: context.appsyncErrors || (asyncIterator as ExecutionResult).errors,
        data: (asyncIterator as ExecutionResult).data || null,
      };
    }

    Object.assign(registration, {
      asyncIterator,
      isRegistered: true,
    });

    const currentRegistrations = this.registrations.get(clientId) || [];
    currentRegistrations.push(registration);

    this.registrations.set(clientId, currentRegistrations);

    // if client does not connect within this amount of time then end iterator.
    this.iteratorTimeout.set(
      clientId,
      setTimeout(() => {
        (asyncIterator as AsyncIterator<ExecutionResult>).return();
        this.iteratorTimeout.delete(clientId);
      }, CONNECTION_TIME_OUT),
    );

    return {
      extensions: {
        subscription: {
          mqttConnections: [
            {
              url: this.url,
              topics: currentRegistrations.map(reg => reg.topicId),
              client: clientId,
            },
          ],
          newSubscriptions: {
            [subscriptionName]: {
              topic: topicId,
              expireTime: Date.now() + TOPIC_EXPIRATION_TIMEOUT,
            },
          },
        },
      },
    };
  }

  subscribeToGraphQL(document: DocumentNode, variables: object, context: any) {
    return subscribe({
      schema: this.appSyncServerContext.schema,
      document,
      variableValues: variables,
      contextValue: context,
    });
  }

  private shouldPublishSubscription(payload, variables) {
    if (payload == null || (typeof payload === 'object' && payload.data == null)) {
      log.warn('Subscription payload is null; Publishing will be skipped');
      return false;
    }

    const variableEntries = Object.entries(variables || {});

    if (!variableEntries.length) {
      return true;
    }

    const data = Object.entries(payload.data || {});
    const payloadData = data.length ? data[0].pop() : null;

    if (!payloadData) {
      return false;
    }
    // every variable key/value pair must match corresponding payload key/value pair
    const variableResult = variableEntries.every(([variableKey, variableValue]) => payloadData[variableKey] === variableValue);

    if (!variableResult) {
      log.warn('Subscription payload did not match variables');
      log.warn('Payload:');
      log.warn(inspect(payload));
      log.warn('Variables:');
      log.warn(inspect(variables));
      return false;
    }

    return true;
  }
}
