import v4 from 'uuid';
import * as retimer from 'retimer';
import * as Connection from 'mqtt-connection';
import * as steed from 'steed';

import { MQTTServer } from './server';
import { Logger } from 'pino';

export class Client {
  private logger: Logger;
  private subscriptions = {};
  nextId: number = 1;
  inflight: {} = {};
  inflightCounter: number = 0;
  private keepAlive: number = 0;
  private _lastDedupId: number = -1;
  private _closed: boolean = false;
  private _closing: boolean = false;
  private timer;
  private id;
  private will;
  private clean;
  constructor(private connection: Connection, private server: MQTTServer) {
    this.logger = server.logger;
    this.setup();
  }

  private setup() {
    const connection = this.connection;

    connection.on('error', () => {});

    const completeConnection = () => {
      this.setupTimer();

      connection.connack({
        returnCode: 0,
        // maybe session_present is null, custom old persistence engine
        // or not persistence defined
        sessionPresent: false,
      });

      this.logger.info('client connected');
      this.server.emit('clientConnected', this);

      connection.on('puback', packet => {
        this.setupTimer();
        this.handlePubAck(packet);
      });

      connection.on('pingreq', () => {
        this.logger.debug('pingreq');
        this.setupTimer();
        this.handlePingReq();
        this.connection.pingresp();
      });

      connection.on('subscribe', packet => {
        this.setupTimer();
        this.handleSubscribe(packet);
      });

      connection.on('publish', packet => {
        this.setupTimer();

        this.handlePublish(packet);
      });

      connection.on('unsubscribe', packet => {
        this.setupTimer();
        this.logger.info({ packet }, 'unsubscribe received');
        steed().map(this, packet.unsubscriptions, this.unsubscribeMapTo, err => {
          if (err) {
            this.logger.warn(err);
            this.close(null, err.message);
            return;
          }

          connection.unsuback({
            messageId: packet.messageId,
          });
        });
      });

      connection.on('disconnect', () => {
        this.logger.debug('disconnect requested');
        this.close(null, 'disconnect request');
      });

      connection.on('error', this.handleError.bind(this));
      connection.removeListener('error', () => {});

      connection.on('close', () => {
        this.onNonDisconnectClose('close');
      });
    };

    connection.once('connect', packet => {
      this.handleConnect(packet, completeConnection);
    });
  }

  private handleError(err) {
    this.server.emit('clientError', err, this);
    this.onNonDisconnectClose(err.message);
  }

  private setupTimer() {
    if (this.keepAlive <= 0) {
      return;
    }

    const timeout = (this.keepAlive * 1000 * 3) / 2;

    this.logger.debug({ timeout: timeout }, 'setting keepAlive timeout');

    if (this.timer) {
      this.timer.reschedule(timeout);
    } else {
      this.timer = retimer(() => {
        this.logger.info('keepAlive timeout');
        this.onNonDisconnectClose('keepAlive timeout');
      }, timeout);
    }
  }

  private doForward(err, packet) {
    if (err) {
      return this.connection && this.connection.emit('error', err);
    }
    this.connection.publish(packet);

    if (packet.qos === 1) {
      this.inflight[packet.messageId] = packet;
    }
  }

  private forward(topic, payload, options, subTopic, qos, cb?: Function) {
    if (options._dedupId <= this._lastDedupId) {
      return;
    }

    this.logger.trace({ topic: topic }, 'delivering message');

    const indexWildcard = subTopic.indexOf('#');
    const indexPlus = subTopic.indexOf('+');
    let forward = true;
    const newId = this.nextId++;

    // Make sure 'nextId' always fits in a uint16 (http://git.io/vmgKI).
    this.nextId %= 65536;

    const packet = {
      topic,
      payload,
      qos,
      messageId: newId,
    };

    if (qos) {
      this.inflightCounter++;
    }

    if (this._closed || this._closing) {
      this.logger.debug({ packet: packet }, 'trying to send a packet to a disconnected client');
      forward = false;
    } else if (this.inflightCounter >= this.server.options.maxInflightMessages) {
      this.logger.warn('too many inflight packets, closing');
      this.close(null, 'too many inflight packets');
      forward = false;
    }

    if (cb) {
      cb();
    }

    // skip delivery of messages in $SYS for wildcards
    forward = forward && !(topic.indexOf('$SYS') >= 0 && ((indexWildcard >= 0 && indexWildcard < 2) || (indexPlus >= 0 && indexPlus < 2)));

    if (forward) {
      if (options._dedupId === undefined) {
        options._dedupId = this.server.nextDedupId();
        this._lastDedupId = options._dedupId;
      }

      if (qos && options.messageId) {
        this.server.updateOfflinePacket(this, options.messageId, packet, this.doForward);
      } else {
        this.doForward(null, packet);
      }
    }
  }

  private unsubscribeMapTo(topic, cb) {
    const sub = this.subscriptions[topic];
    if (!sub || !sub.handler) {
      this.server.emit('unsubscribed', topic, this);
      return cb();
    }

    this.server.listener.unsubscribe(topic, sub.handler, err => {
      if (err) {
        cb(err);
        return;
      }

      if (!this._closing || this.clean) {
        delete this.subscriptions[topic];
        this.logger.info({ topic: topic }, 'unsubscribed');
        this.server.emit('unsubscribed', topic, this);
      }

      cb();
    });
  }

  private handleConnect(packet, completeConnection) {
    const client = this.connection;

    this.id = packet.clientId;

    this.logger = this.logger.child({ client: this });

    // for MQTT 3.1.1 (protocolVersion == 4) it is valid to receive an empty
    // clientId if cleanSession is set to 1. In this case, Mosca should generate
    // a random ID.
    // Otherwise, the connection should be rejected.
    if (!this.id) {
      if (packet.protocolVersion == 4 && packet.clean) {
        this.id = v4();
      } else {
        this.logger.info('identifier rejected');
        client.connack({
          returnCode: 2,
        });
        client.stream.end();
        return;
      }
    }

    this.keepAlive = packet.keepalive;
    this.will = packet.will;

    this.clean = packet.clean;

    if (this.id in this.server.clients) {
      this.server.clients[this.id].close(completeConnection, 'new connection request');
    } else {
      completeConnection();
    }
  }

  private handlePingReq() {
    this.server.emit('pingReq', this);
  }
  private handlePubAck(packet) {
    const logger = this.logger;

    logger.debug({ packet: packet }, 'pubAck');
    if (this.inflight[packet.messageId]) {
      this.server.emit('delivered', this.inflight[packet.messageId], this);
      this.inflightCounter--;
      delete this.inflight[packet.messageId];
    } else {
      logger.info({ packet: packet }, 'no matching packet');
    }
  }

  doSubscribe(s, cb) {
    const handler = (topic, payload, options) => {
      this.forward(topic, payload, options, s.topic, s.qos);
    };

    if (this.subscriptions[s.topic] === undefined) {
      this.subscriptions[s.topic] = { qos: s.qos, handler: handler };
      this.server.listener.subscribe(s.topic, handler, err => {
        if (err) {
          delete this.subscriptions[s.topic];
          cb(err);
          return;
        }
        this.logger.info({ topic: s.topic, qos: s.qos }, 'subscribed to topic');
        this.subscriptions[s.topic] = { qos: s.qos, handler: handler };
        cb(null, true);
      });
    } else {
      cb(null, true);
    }
  }
  handleEachSub(s, cb) {
    if (this.subscriptions[s.topic] === undefined) {
      this.doSubscribe(s, cb);
    } else {
      cb(null, true);
    }
  }
  handleSubscribe(packet) {
    const logger = this.logger;

    logger.debug({ packet: packet }, 'subscribe received');

    const granted = Client.calculateGranted(this, packet);

    steed().map(this, packet.subscriptions, this.handleEachSub, (err, authorized) => {
      if (err) {
        this.close(null, err.message);
        return;
      }

      packet.subscriptions.forEach((sub, index) => {
        if (authorized[index]) {
          this.server.emit('subscribed', sub.topic, this);
        } else {
          granted[index] = 0x80;
        }
      });

      if (!this._closed) {
        this.connection.suback({
          messageId: packet.messageId,
          granted: granted,
        });
      }
    });
  }

  handlePublish(packet) {
    // Mosca does not support QoS2
    // if onQoS2publish === 'dropToQoS1', don't just ignore QoS2 message, puback it
    // by converting internally to qos 1.
    // this fools mqtt.js into not holding all messages forever
    // if onQoS2publish === 'disconnect', then break the client connection if QoS2
    if (packet.qos === 2) {
      switch (this.server.onQoS2publish) {
        case 'dropToQoS1':
          packet.qos = 1;
          break;
        case 'disconnect':
          if (!this._closed && !this._closing) {
            this.close(null, 'qos2 caused disconnect');
          }
          return;
        default:
          break;
      }
    }

    const doPubAck = () => {
      if (packet.qos === 1 && !(this._closed || this._closing)) {
        this.connection.puback({
          messageId: packet.messageId,
        });
      }
    };

    doPubAck();
  }

  onNonDisconnectClose(reason) {
    const logger = this.logger;
    const will = this.will;

    if (this._closed || this._closing) {
      return;
    }

    if (this.will) {
      logger.info({ packet: will }, 'delivering last will');
      setImmediate(() => {
        this.handlePublish(will);
      });
    }

    this.close(null, reason);
  }

  close(callback, reason) {
    callback = callback || (() => {});

    if (this._closed || this._closing) {
      return callback();
    }

    if (this.id) {
      this.logger.debug('closing client, reason: ' + reason);

      if (this.timer) {
        this.timer.clear();
      }
    }
    const cleanup = () => {
      this._closed = true;

      this.logger.info('closed');
      this.connection.removeAllListeners();
      // ignore all errors after disconnection
      this.connection.on('error', function() {});
      this.server.emit('clientDisconnected', this, reason);

      callback();
    };

    this._closing = true;
    steed.map(this, Object.keys(this.subscriptions), this.unsubscribeMapTo, err => {
      if (err) {
        this.logger.info(err);
      }

      // needed in case of errors
      if (!this._closed) {
        cleanup();
        // prefer destroy[Soon]() to prevent FIN_WAIT zombie connections
        if (this.connection.stream.destroySoon) {
          this.connection.stream.destroySoon();
        } else if (this.connection.stream.destroy) {
          this.connection.stream.destroy();
        } else {
          this.connection.stream.end();
        }
      }
    });
  }
  static calculateGranted(client, packet) {
    return packet.subscriptions.map(function(e) {
      if (e.qos === 2) {
        e.qos = 1;
      }
      if (client.subscriptions[e.topic] !== undefined) {
        client.subscriptions[e.topic].qos = e.qos;
      }
      return e.qos;
    });
  }
}
