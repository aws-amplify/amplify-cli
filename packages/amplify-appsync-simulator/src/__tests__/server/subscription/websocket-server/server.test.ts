import { createServer, Server } from 'http';
import { URL, URLSearchParams } from 'url';
import WS from 'ws';
import portFinder from 'portfinder';
import { PubSub } from 'graphql-subscriptions';
import { parse } from 'graphql';

import { WebsocketSubscriptionServer, ConnectionContext } from '../../../../server/subscription/websocket-server/server';
import { MESSAGE_TYPES } from '../../../../server/subscription/websocket-server/message-types';
const SOCKET_TIMEOUT = 10000;
jest.setTimeout(60000);

async function waitForConnection(socket: WS) {
  return new Promise((resolve, reject) => {
    let done = false;
    const timeoutHandle = setTimeout(() => {
      done = true;
      reject('Websocket Timed out');
    }, SOCKET_TIMEOUT);
    socket.onopen = () => {
      if (!done) {
        clearTimeout(timeoutHandle);
        resolve();
      }
    };
  });
}

async function waitForMessage(socket: WS, messageType: string, maxDuration: number = 15000): Promise<any> {
  return new Promise((resolve, reject) => {
    let done: boolean = false;
    const timer = setTimeout(() => {
      done = true;
      reject('Waiting for the message timed out');
    }, maxDuration);
    socket.onmessage = (msg: WS.MessageEvent) => {
      const payload = JSON.parse(msg.data as string);
      if (payload.type === messageType) {
        if (!done) {
          done = true;
          clearTimeout(timer);
          resolve(payload);
        }
      }
    };
  });
}

describe('WebsocketSubscriptionServer', () => {
  let server: WebsocketSubscriptionServer;
  let httpServer: Server;
  const onSubscribeHandler = jest.fn();
  const onConnectHandler = jest.fn();
  let serverPort = 20005;
  const SUBSCRIPTION_PATH = '/graphql';
  let connectionTimeoutDuration: number;
  let keepAlive: number;
  beforeEach(async () => {
    jest.resetAllMocks();
    httpServer = createServer();
    connectionTimeoutDuration = 500;
    keepAlive = 100;
    server = new WebsocketSubscriptionServer(
      {
        onSubscribeHandler,
        onConnectHandler,
        connectionTimeoutDuration,
        keepAlive,
      },
      { server: httpServer, path: SUBSCRIPTION_PATH },
    );

    serverPort = await portFinder.getPortPromise({
      startPort: 20001,
      stopPort: 66666,
    });
    httpServer.listen(serverPort);
    server.start();
  });
  afterEach(() => {
    server.stop();
    httpServer.close();
  });

  describe('Connect', () => {
    it('should close connection when the protocol is not graphql-ws', async done => {
      const client = new WS(`ws://localhost:${serverPort}${SUBSCRIPTION_PATH}`, 'something');
      client.addEventListener('close', event => {
        expect(event.code).toEqual(1002);
        expect(onConnectHandler).not.toHaveBeenCalled();
        done();
      });
    });

    it('should accept connection when the protocol is graphql-ws', async done => {
      const client = new WS(`ws://localhost:${serverPort}${SUBSCRIPTION_PATH}`, 'graphql-ws');
      client.addEventListener('close', event => {
        expect(event.wasClean).toBeTruthy();
        done();
      });
      await waitForConnection(client);
      client.close();
      expect(onConnectHandler).toHaveBeenCalled();
    });

    it('should call onConnectionHandler with header', async () => {
      const header = {
        Authorization: 'My auth header',
      };
      const query = new URLSearchParams({
        header: Buffer.from(JSON.stringify(header)).toString('base64'),
      });

      const client = new WS(`ws://localhost:${serverPort}${SUBSCRIPTION_PATH}?${query.toString()}`, 'graphql-ws');
      await waitForConnection(client);
      client.close();
      expect(onConnectHandler).toHaveBeenCalled();
      console.log(onConnectHandler.mock.calls[0][1]);
      expect(onConnectHandler.mock.calls[0][1]).toEqual(header);
    });

    it('should fail connection when onConnectionHandler throw and error', async done => {
      onConnectHandler.mockRejectedValue('error');
      const client = new WS(`ws://localhost:${serverPort}${SUBSCRIPTION_PATH}`, 'graphql-ws');
      client.addEventListener('close', event => {
        expect(event.code).toEqual(1002);
        done();
      });
      await waitForConnection(client);
      client.close();
    });
  });

  describe('Connection init', () => {
    let client;
    beforeEach(async () => {
      jest.useFakeTimers();
      const url = new URL(`ws://localhost:${serverPort}${SUBSCRIPTION_PATH}`).toString();
      client = new WS(url, 'graphql-ws');
      await waitForConnection(client);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should ACK connection', async done => {
      const connectionIntiMessage = {
        type: MESSAGE_TYPES.GQL_CONNECTION_INIT,
        payload: {},
      };
      client.onmessage = (message: WS.MessageEvent) => {
        const data = JSON.parse(message.data as string);
        expect(data.type).toEqual(MESSAGE_TYPES.GQL_CONNECTION_ACK);
        expect(data.payload.connectionTimeout).toEqual(connectionTimeoutDuration);
        client.close();
        done();
      };
      client.send(JSON.stringify(connectionIntiMessage));
    });

    it('should send Error if  the Connection init sends invalid message', async done => {
      const invalidConnectionIntiMessage = {
        type: 'invalid',
        payload: {},
      };
      client.onmessage = (message: WS.MessageEvent) => {
        const data = JSON.parse(message.data as string);
        expect(data.type).toEqual(MESSAGE_TYPES.GQL_ERROR);
        client.close();
        done();
      };
      client.send(JSON.stringify(invalidConnectionIntiMessage));
    });

    it('should send KEEP_ALIVE message periodically', async () => {
      const connectionIntiMessage = {
        type: MESSAGE_TYPES.GQL_CONNECTION_INIT,
        payload: {},
      };

      client.send(JSON.stringify(connectionIntiMessage));
      await waitForMessage(client, MESSAGE_TYPES.GQL_CONNECTION_ACK);

      jest.advanceTimersByTime(keepAlive + 1);
      await waitForMessage(client, MESSAGE_TYPES.GQL_CONNECTION_KEEP_ALIVE);

      jest.advanceTimersByTime(keepAlive + 10);
      await waitForMessage(client, MESSAGE_TYPES.GQL_CONNECTION_KEEP_ALIVE);
    });
  });

  describe('Start subscription', () => {
    let client;
    let pubsub: PubSub;
    let connectionContext: ConnectionContext;

    const query = /* GraphQL */ `
      subscription onMessage {
        onMessage: String
      }
    `;
    const variables = {
      var1: 'value1',
    };
    const headers = { Authorization: 'authorization headers' };
    const extensions = {
      authorization: headers,
    };
    const id = 'some-unique-id';

    beforeEach(async () => {
      const url = new URL(`ws://localhost:${serverPort}${SUBSCRIPTION_PATH}`).toString();
      client = new WS(url, 'graphql-ws');
      pubsub = new PubSub();
      onConnectHandler.mockImplementation(context => {
        connectionContext = context;
      });
      await waitForConnection(client);
      const connectionIntiMessage = {
        type: MESSAGE_TYPES.GQL_CONNECTION_INIT,
        payload: {},
      };
      client.send(JSON.stringify(connectionIntiMessage));
      await waitForMessage(client, MESSAGE_TYPES.GQL_CONNECTION_ACK);
    });

    it('should send MESSAGE_TYPES.GQL_START_ACK on when a subscription is stated', async () => {
      const asyncIterator = pubsub.asyncIterator('onMessage');
      onSubscribeHandler.mockReturnValue(asyncIterator);
      const req = JSON.stringify({
        type: MESSAGE_TYPES.GQL_START,
        id,
        payload: {
          data: JSON.stringify({
            query,
            variables,
          }),
          extensions,
        },
      });
      client.send(req);
      const msg = await waitForMessage(client, MESSAGE_TYPES.GQL_START_ACK);
      expect(msg.id).toEqual(id);
      expect(onSubscribeHandler).toHaveBeenCalledTimes(1);
      expect(onSubscribeHandler).toHaveBeenCalledWith(parse(query), variables, headers, connectionContext.request);
      expect(connectionContext.subscriptions.get(id)).toEqual({
        id,
        variables,
        document: parse(query),
        asyncIterator,
      });
    });

    it('should add multiple subscriptions in same connection', async () => {
      const asyncIteratorOne = pubsub.asyncIterator('onMessage');
      const asyncIteratorTwo = pubsub.asyncIterator('onMessageUpdate');
      onSubscribeHandler.mockReturnValueOnce(asyncIteratorOne);
      onSubscribeHandler.mockReturnValueOnce(asyncIteratorTwo);

      const req = {
        type: MESSAGE_TYPES.GQL_START,
        id,
        payload: {
          data: JSON.stringify({
            query,
            variables,
          }),
          extensions,
        },
      };
      client.send(JSON.stringify(req));
      const msg = await waitForMessage(client, MESSAGE_TYPES.GQL_START_ACK);
      expect(msg.id).toEqual(id);
      expect(onSubscribeHandler).toHaveBeenCalledTimes(1);
      expect(onSubscribeHandler).toHaveBeenCalledWith(parse(query), variables, headers, connectionContext.request);
      expect(connectionContext.subscriptions.get(id)).toEqual({
        id,
        variables,
        document: parse(query),
        asyncIterator: asyncIteratorOne,
      });
      const id2 = 'some-id-2';
      client.send(JSON.stringify({ ...req, id: id2 }));
      const msg2 = await waitForMessage(client, MESSAGE_TYPES.GQL_START_ACK);
      expect(msg2.id).toEqual(id2);
      expect(onSubscribeHandler).toHaveBeenCalledTimes(2);
      expect(onSubscribeHandler).toHaveBeenLastCalledWith(parse(query), variables, headers, connectionContext.request);
      expect(connectionContext.subscriptions.size).toEqual(2);
      expect(connectionContext.subscriptions.get(id2)).toEqual({
        id: id2,
        variables,
        document: parse(query),
        asyncIterator: asyncIteratorTwo,
      });
    });

    it('should return the previous async iterator when same subscription id is used', async () => {
      let iteratorReturnSpy;
      onSubscribeHandler.mockImplementation(() => {
        const iterator = pubsub.asyncIterator('onMessage');
        iteratorReturnSpy = jest.spyOn(iterator, 'return');
        return iterator;
      });

      const payload = JSON.stringify({
        type: MESSAGE_TYPES.GQL_START,
        id,
        payload: {
          data: JSON.stringify({
            query,
            variables,
          }),
          extensions,
        },
      });
      client.send(payload);
      await waitForMessage(client, MESSAGE_TYPES.GQL_START_ACK);

      const lastIteratorSpy = iteratorReturnSpy;
      // repeat the same subscription
      client.send(payload);
      await waitForMessage(client, MESSAGE_TYPES.GQL_START_ACK);
      expect(lastIteratorSpy).toHaveBeenCalled();
    });

    it('should send MESSAGE_TYPES.GQL_ERROR when subscription fails', async () => {
      const error = {
        data: null,
        errors: [{ type: 'Authorization', message: 'You are not authorized' }],
      };
      onSubscribeHandler.mockReturnValue(error);

      const payload = JSON.stringify({
        type: MESSAGE_TYPES.GQL_START,
        id,
        payload: {
          data: JSON.stringify({
            query,
            variables,
          }),
          extensions,
        },
      });
      client.send(payload);
      const msg = await waitForMessage(client, MESSAGE_TYPES.GQL_ERROR);
      expect(msg.payload).toEqual(error);
    });

    it('should send MESSAGE_TYPES.GQL_DATA when there is a mutation', async () => {
      const iterator = pubsub.asyncIterator('onMessage');
      onSubscribeHandler.mockReturnValue(iterator);

      const payload = JSON.stringify({
        type: MESSAGE_TYPES.GQL_START,
        id,
        payload: {
          data: JSON.stringify({
            query,
            variables,
          }),
          extensions,
        },
      });
      client.send(payload);
      await waitForMessage(client, MESSAGE_TYPES.GQL_START_ACK);
      const data = {
        onMessage: 'hello from iterator',
      };
      pubsub.publish('onMessage', data);
      const msg = await waitForMessage(client, MESSAGE_TYPES.GQL_DATA);
      expect(msg).toEqual({
        type: MESSAGE_TYPES.GQL_DATA,
        id,
        payload: data,
      });
    });
  });

  describe('It should stop subscription when MESSAGE_TYPES.GQL_STOP is sent', () => {
    let client;
    let pubsub: PubSub;
    let asyncIterator;
    let connectionContext: ConnectionContext;
    const query = /* GraphQL */ `
      subscription onMessage {
        onMessage: String
      }
    `;
    const variables = {
      var1: 'value1',
    };
    const headers = { Authorization: 'authorization headers' };
    const extensions = {
      authorization: headers,
    };
    const id = 'some-unique-id';

    beforeEach(async () => {
      const url = new URL(`ws://localhost:${serverPort}${SUBSCRIPTION_PATH}`).toString();
      client = new WS(url, 'graphql-ws');
      pubsub = new PubSub();
      asyncIterator = pubsub.asyncIterator('something');
      onSubscribeHandler.mockReturnValue(asyncIterator);
      onConnectHandler.mockImplementation(context => {
        connectionContext = context;
      });
      await waitForConnection(client);
      const connectionIntiMessage = {
        type: MESSAGE_TYPES.GQL_CONNECTION_INIT,
        payload: {},
      };
      client.send(JSON.stringify(connectionIntiMessage));
      await waitForMessage(client, MESSAGE_TYPES.GQL_CONNECTION_ACK);
      client.send(
        JSON.stringify({
          type: MESSAGE_TYPES.GQL_START,
          id,
          payload: {
            data: JSON.stringify({
              query,
              variables,
            }),
            extensions,
          },
        }),
      );
      await waitForMessage(client, MESSAGE_TYPES.GQL_START_ACK);
    });

    it('should stop subscription', async () => {
      const asyncIteratorReturnSpy = jest.spyOn(asyncIterator, 'return');
      expect(connectionContext.subscriptions.size).toEqual(1);
      expect(connectionContext.subscriptions.get(id)).toEqual({
        id,
        document: parse(query),
        variables,
        asyncIterator,
      });

      client.send(
        JSON.stringify({
          type: MESSAGE_TYPES.GQL_STOP,
          id,
        }),
      );
      await waitForMessage(client, MESSAGE_TYPES.GQL_COMPLETE);
      expect(connectionContext.subscriptions.size).toEqual(0);
      expect(asyncIteratorReturnSpy).toHaveBeenCalled();
    });
  });
});
