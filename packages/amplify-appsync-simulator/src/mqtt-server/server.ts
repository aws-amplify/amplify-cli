import * as Connection from 'mqtt-connection';
import * as ws from 'websocket-stream';
import * as steed from 'steed';
import * as pino from 'pino';
import * as extend from 'extend';
import * as nanoid from 'nanoid';
import { TrieListener } from './trie-listener';
import { Client } from './client';
import { EventEmitter } from 'events';

export type MQTTServerOptions = {
  id?: string;
  maxConnections?: number;
  backend?: {
    wildcardOne: string;
    wildcardSome: string;
  };
  stats?: boolean;
  publishNewClient?: boolean;
  publishClientDisconnect?: boolean;
  publishSubscriptions?: boolean;
  maxInflightMessages?: number;
  onQoS2publish?: string;
  logger?: {
    name?: string;
    level?: string;
  };
};
const DEFAULT_OPTIONS: MQTTServerOptions = {
  maxConnections: 10000000,
  backend: {
    wildcardOne: '+',
    wildcardSome: '#',
  },
  stats: false,
  publishNewClient: true,
  publishClientDisconnect: true,
  publishSubscriptions: true,
  maxInflightMessages: 1024,
  onQoS2publish: 'noack',
  logger: {
    name: 'amplify-mqtt-server',
    level: 'warn',
  },
};
const nop = () => {};

/**
 * The Amplify MQTT Server is a very simple MQTT server that
 * provides a simple event-based API to craft your own MQTT logic
 * It supports QoS 0 & 1, without external storage.
 *
 *
 * Options:
 *  - `host`, the IP address of the server (see http://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback).
 *    that will power this server.
 *  - `maxInflightMessages`, the maximum number of inflight messages per client.
 *  - `logger`, the options for Pino.
 *     A sub-key `factory` is used to specify what persistence
 *     to use.
 *  - `stats`, publish the stats every 10s (default false).
 *  - `publishNewClient`, publish message to topic "$SYS/{broker-id}/new/clients" when new client connects.
 *  - `publishClientDisconnect`, publish message to topic "$SYS/{broker-id}/disconnect/clients" when a client disconnects.
 *  - `publishSubscriptions`, publish message to topic "$SYS/{broker-id}/new/(un)subscribes" when a client subscribes/unsubscribes.
 *
 * Events:
 *  - `clientConnected`, when a client is connected;
 *    the client is passed as a parameter.
 *  - `clientDisconnecting`, when a client is being disconnected;
 *    the client is passed as a parameter.
 *  - `clientDisconnected`, when a client is disconnected;
 *    the client is passed as a parameter.
 *  - `clientError`, when the server identifies a client connection error;
 *    the error and the client are passed as parameters.
 *  - `published`, when a new message is published;
 *    the packet and the client are passed as parameters.
 *  - `subscribed`, when a client is subscribed to a topic;
 *    the topic and the client are passed as parameters.
 *  - `unsubscribed`, when a client is unsubscribed to a topic;
 *    the topic and the client are passed as parameters.
 *
 * @param {Object} opts The option object
 * @param {Function} callback The ready callback
 * @api public
 */

export class MQTTServer extends EventEmitter {
  options: MQTTServerOptions;
  public clients: {};
  private _dedupId: number;
  private closed: boolean;
  logger: pino.Logger;
  onQoS2publish;
  public id: string;
  listener;

  constructor(options: MQTTServerOptions = {}, private callback = (err: any, data?: any) => {}) {
    super();
    this.options = extend(true, {}, DEFAULT_OPTIONS, options);

    this._dedupId = 0;
    this.clients = {};
    this.closed = false;
    this.closed = false;
    this.logger = pino(this.options.logger);
    this.onQoS2publish = this.options.onQoS2publish;
    this.id = this.options.id || nanoid(7);

    new Promise(resolve => {
      const listener = new TrieListener(this.options.backend);
      listener.once('ready', function() {
        resolve(listener);
      });
    })
      .then(listener => {
        this.listener = listener;
        this.init();
      })
      .catch(err => {
        callback(err);
      });
  }
  private init() {
    this.on('clientConnected', client => {
      if (this.options.publishNewClient) {
        this.publish({
          topic: `$SYS/${this.id}/new/clients`,
          payload: client.id,
        });
      }

      this.clients[client.id] = client;
    });

    this.once('ready', () => {
      this.callback(null, this);
    });

    this.on('ready', () => {
      this.listener.subscribe('$SYS/+/new/clients', (topic, payload) => {
        const serverId = topic.split('/')[1];
        const clientId = payload;

        if (this.clients[clientId] && serverId !== this.id) {
          this.clients[clientId].close(null, 'new connection request');
        }
      });
    });

    if (this.options.publishSubscriptions) {
      this.on('subscribed', (topic, client) => {
        this.publish({
          topic: `$SYS/${this.id}/new/subscribes`,
          payload: JSON.stringify({
            clientId: client.id,
            topic: topic,
          }),
        });
      });

      this.on('unsubscribed', (topic, client) => {
        this.publish({
          topic: '$SYS/' + this.id + '/new/unsubscribes',
          payload: JSON.stringify({
            clientId: client.id,
            topic: topic,
          }),
        });
      });
    }

    this.on('clientDisconnected', client => {
      if (this.options.publishClientDisconnect) {
        this.publish({
          topic: '$SYS/' + this.id + '/disconnect/clients',
          payload: client.id,
        });
      }
      delete this.clients[client.id];
    });
  }

  toString() {
    return 'AmplifyMQTTServer.Server';
  }

  subscribe(topic, callback, done) {
    this.listener.subscribe(topic, callback, done);
  }

  publish(packet, client?, callback?) {
    let logger = this.logger;

    if (typeof client === 'function') {
      callback = client;
      client = null;
    } else if (client) {
      logger = client.logger;
    }

    if (!callback) {
      callback = nop;
    }

    const newPacket = {
      topic: packet.topic,
      payload: packet.payload,
      messageId: nanoid(7),
      qos: packet.qos,
      retain: packet.retain,
    };

    const opts: any = {
      qos: packet.qos,
      messageId: newPacket.messageId,
    };

    if (client) {
      opts.clientId = client.id;
    }

    if (this.closed) {
      logger.debug({ packet: newPacket }, 'not delivering because we are closed');
      return;
    }

    this.listener.publish(newPacket.topic, newPacket.payload, opts, () => {
      if (newPacket.topic.indexOf('$SYS') >= 0) {
        logger.trace({ packet: newPacket }, 'published packet');
      } else {
        logger.debug({ packet: newPacket }, 'published packet');
      }
      this.emit('published', newPacket, client);
      callback(undefined, newPacket);
    });
  }

  close(callback = nop) {
    const stuffToClose = [];

    if (this.closed) {
      return callback();
    }

    this.closed = true;

    Object.keys(this.clients).forEach(i => {
      stuffToClose.push(this.clients[i]);
    });

    steed.each(
      stuffToClose,
      (toClose, cb) => {
        try {
          toClose.close(cb, 'server closed');
        } catch (e) {}
      },
      () => {
        this.listener.close(() => {
          this.logger.info('server closed');
          this.emit('closed');
          callback();
        });
      }
    );
  }

  updateOfflinePacket(client, originMessageId, packet, callback) {
    if (callback) {
      callback(null, packet);
    }
  }
  attachHttpServer(server, path) {
    const opt: { server: any; path?: string } = { server: server };
    if (path) {
      opt.path = path;
    }

    const wss = ws.createServer(opt);
    wss.on('stream', stream => {
      const conn = new Connection(stream);
      new Client(conn, this);
    });
  }

  nextDedupId(): number {
    return this._dedupId++;
  }
}
