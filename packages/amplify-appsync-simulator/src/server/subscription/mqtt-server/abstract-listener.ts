import { EventEmitter } from 'events';

export type Settings = {
  separator?: string;
  wildcardOne?: string;
  wildcardSome?: string;
};

export abstract class AbstractListener extends EventEmitter {
  protected _ready: boolean = false;
  protected _closed: boolean = false;

  constructor(protected settings: Settings = {}) {
    super();

    this._ready = false;
    this._closed = false;

    this.on('ready', () => {
      this._ready = true;
    });

    this.on('closed', () => {
      this._closed = true;
    });

    this.on('newListener', (event, listener) => {
      if (event === 'ready' && this._ready) {
        listener();
      }
    });

    this.setMaxListeners(0);
  }

  protected _raiseIfClosed() {
    if (this._closed) {
      throw new Error('This MQTT listener is closed');
    }
  }

  /**
   * This method provides a way for users to subscribe for messages.
   *
   * The messages are published on topics, that is just a "path", e.g.
   * `/this/is/a/topic`.
   * The topic are organized in a hierarchy, and `subscribe` support the usage
   * of wildcards, e.g. you can subscribe to `*` and it will
   * match all the topics
   *
   * Example:
   *       listener.subscribe("*", function () {
   *         // this will print { '0': "hello/42", '1': "a message" }
   *         console.log(arguments);
   *       });
   *
   * @param {String} topic the topic to subscribe to
   * @param {Function} callback the callback that will be called when a new message is published.
   * @param {Function} done the callback that will be called when the subscribe is completed
   * @api public
   */
  abstract subscribe(topic, callback?, done?);

  /**
   * This method allow publishing of messages to topics.
   *
   * Example:
   *     listener.publish("hello/42", "a message", function () {
   *       console.log("message published");
   *     });
   *
   *
   * @param {String} topic the topic to publish to
   * @param {Object} payload the callback that will be called when a new message is published.
   * @param {Object} options (optional) Metadata associated with the message (e.g. qos, messageId). If you only specify 3 parameters to your method then you won't be passed this parameter.
   * @param {Function} done the callback that will be called after the message has been published.
   * @api public
   */
  abstract publish(topic, payload, done?: Function);
  abstract unsubscribe(topic, callback, done?: Function);

  abstract close(done?: Function);
}
