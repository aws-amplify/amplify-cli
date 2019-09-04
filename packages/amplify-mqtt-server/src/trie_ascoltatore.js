"use strict";

var AbstractListener = require("./abstract_listener");
var util = require("./util");
var defer = util.defer;
var debug = require("debug")("ascoltatori:trie");
var Qlobber = require("qlobber").Qlobber;

/**
 * A TrieAscoltatore is a class that inherits from AbstractAscoltatore.
 * It is backed by a Qlobber.
 *
 * @api public
 */
function TrieAscoltatore(settings) {
  AbstractListener.call(this, settings);

  settings = settings || {};

  this._matcher = new Qlobber({
    separator: settings.separator || '/',
    wildcard_one: settings.wildcardOne || '+',
    wildcard_some: settings.wildcardSome || '*'
  });

  this.emit("ready");
}


/**
 * See AbstractAscoltatore for the public API definitions.
 *
 * @api private
 */

TrieAscoltatore.prototype = Object.create(AbstractListener.prototype);

TrieAscoltatore.prototype.subscribe = function subscribe(topic, callback, done) {
  this._raiseIfClosed();
  debug("registered new subscriber for topic " + topic);

  this._matcher.add(topic, callback);
  defer(done);
};

TrieAscoltatore.prototype.publish = function (topic, message, options, done) {
  this._raiseIfClosed();
  debug("new message published to " + topic);

  var cbs = this._matcher.match(topic);

  for (var i = 0; i < cbs.length; i++) {
    cbs[i](topic, message, options);
  }

  defer(done);
};

TrieAscoltatore.prototype.unsubscribe = function unsubscribe(topic, callback, done) {
  this._raiseIfClosed();

  debug("deregistered subscriber for topic " + topic);

  this._matcher.remove(topic, callback);

  defer(done);
};

TrieAscoltatore.prototype.close = function close(done) {
  this._matcher.clear();
  this.emit("closed");

  debug("closed");

  defer(done);
};

util.aliasAscoltatore(TrieAscoltatore.prototype);

/**
 * Exports the TrieAscoltatore.
 *
 * @api public
 */
module.exports = TrieAscoltatore;
