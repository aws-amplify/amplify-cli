"use strict";

var EventEmitter = require('events').EventEmitter;

/**
 * An `AbstractAscoltatore` is a class that inherits from `EventEmitter`.
 * It is also the base class of `ascoltatori`. It is not meant to be used alone,
 * but it defines the interface for every ascoltatore.
 *
 * Every ascoltatore emits the following events:
 *  - `ready`, when the ascolatore is ready for subscribing and/or
 *     publishing messages;
 *  - `closed`, when the ascoltatore has closed all the connections
 *     and therefore it cannot accept new messages;
 *  - `error`, if something goes wrong.
 *
 * @api public
 */
function AbstractAscoltatore(settings, nativeSettings) {
  EventEmitter.call(this);

  settings = settings || {};
  nativeSettings = nativeSettings || {};

  this._separator = settings.separator || '/',
  this._wildcardOne = settings.wildcardOne || '+',
  this._wildcardSome = settings.wildcardSome || '*';
  this._nativeSettings = nativeSettings;

  if (nativeSettings.separator && 
      (this._separator !== nativeSettings.separator)) {
    this._reInSeparator = new RegExp('\\' + this._separator, 'g');
    this._reOutSeparator = new RegExp('\\' + nativeSettings.separator, 'g');
  }
  if (nativeSettings.wildcardOne &&
      (this._wildcardOne !== nativeSettings.wildcardOne)) {
    this._reInWildcardOne = new RegExp('\\' + this._wildcardOne, 'g');
  }
  if (nativeSettings.wildcardSome &&
      (this._wildcardSome !== nativeSettings.wildcardSome)) {
    this._reInWildcardSome = new RegExp('\\' + this._wildcardSome, 'g');
  }

  this._setPublish();

  this._ready = false;
  this._closed = false;

  var that = this;

  this.on("ready", function() {
    that._ready = true;
  });

  this.on("closed", function() {
    that._closed = true;
  });

  this.on("newListener", function(event, listener) {
    if (event === "ready" && that._ready) {
      listener();
    }
  });

  this.setMaxListeners(0);
}

AbstractAscoltatore.prototype = Object.create(EventEmitter.prototype);

AbstractAscoltatore.prototype._raiseIfClosed = function raiseIfClosed() {
  if (this._closed) {
    throw new Error("This ascoltatore is closed");
  }
};

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
 *       ascoltatore.subscribe("*", function () {
 *         // this will print { '0': "hello/42", '1': "a message" }
 *         console.log(arguments); 
 *       });
 *
 * @param {String} topic the topic to subscribe to
 * @param {Function} callback the callback that will be called when a new message is published.
 * @param {Function} done the callback that will be called when the subscribe is completed
 * @api public
 */
AbstractAscoltatore.prototype.subscribe = function(topic, callback, done) {
  throw new Error("Subclass to implement");
};

/**
 * This method allow publishing of messages to topics.
 *
 * Example:
 *     ascoltatore.publish("hello/42", "a message", function () {
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
AbstractAscoltatore.prototype.publish = function(topic, payload, options, done) {
  throw new Error("Subclass to implement");
};

AbstractAscoltatore.prototype._setPublish = function() {
  var proto = Object.getPrototypeOf(this),
      f = proto.publish,
      publish,
      newPublish;

  if (!f) { return; }

  if (f.length === 4) {
    publish = this.publish;
  } else {
    publish = function (topic, payload, options, done) {
      return f.call(this, topic, payload, done);
    };
  }

  newPublish = function (topic, payload, options, done) {
    if ((typeof options === 'function') ||
        (done && (typeof done !== 'function'))) {
      done = options;
      options = {};
    } else if ((options === undefined) || (options === null)) {
      options = {};
    }

    return publish.call(this, topic, payload, options, done);
  };

  this.publish = newPublish;

  if (proto.pub === proto.publish) {
    this.pub = newPublish;
  }
};

/**
 * This method provides the inverse of subscribe.
 *
 * @param {String} topic the topic from which to unsubscribe
 * @param {Function} callback the callback that will be unsubscribed
 * @param {Function} done the callback that will be called when the unsubscribe is completed
 * @api public
 */
AbstractAscoltatore.prototype.unsubscribe = function(topic, callback, done) {
  throw new Error("Subclass to implement");
};

/**
 * This method closes the Ascoltatore.
 * After this method is called every call to subscribe or publish will raise
 * an exception
 *
 * @param {Function} done the callback that will be called when Ascoltatore is closed
 * @api public
 */
AbstractAscoltatore.prototype.close = function(done) {
  throw new Error("Subclass to implement");
};

AbstractAscoltatore.prototype._subTopic = function(topic) {
  if (this._reInSeparator) {
    topic = topic.replace(this._reInSeparator,
                          this._nativeSettings.separator);
  }
  if (this._reInWildcardSome) {
    topic = topic.replace(this._reInWildcardSome,
                          this._nativeSettings.wildcardSome);
  }
  if (this._reInWildcardOne) {
    topic = topic.replace(this._reInWildcardOne,
                          this._nativeSettings.wildcardOne);
  }
  return topic;
};

AbstractAscoltatore.prototype._recvTopic = function(topic) {
  if (this._reOutSeparator) {
    topic = topic.replace(this._reOutSeparator, this._separator);
  }
  return topic;
};

AbstractAscoltatore.prototype._pubTopic = function(topic) {
  if (this._reInSeparator) {
    topic = topic.replace(this._reInSeparator,
                          this._nativeSettings.separator);
  }
  return topic;
};

/**
 * Exports the AbstractAscoltatore;
 *
 * @api public
 */
module.exports = AbstractAscoltatore;
