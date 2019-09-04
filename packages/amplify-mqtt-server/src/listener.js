'use strict';
module.exports.TrieAscoltatore = require('./trie_ascoltatore');

var util = require('./util');

/**
 *
 * @api private
 */

/**
 * Builds an ascolatore based on the proper type.
 * It will encapsulate it in a PrefixAscolatore if a prefix key is
 * present.
 * The other options are passed through the constructor of the
 * Ascoltatore
 *
 * Options:
 *  - `type`, it can be "amqp", "trie", "eventemitter2", "redis", "zmq", or just a class
 *    that will be instantiated (i.e. with `new`).
 *  - `prefix`, will be passed to the PrefixAscoltatore.
 *  - `json`, it can be setted to false if you do not want your messages
 *    to be wrapped inside JSON.
 *  - any other option that the ascolatore constructor may need.
 *
 *  @api public
 *  @param {Object} opts The options
 *  @param {Function} done The callback that will be called when the
 *  ascoltatore will be ready
 */
module.exports.build = function build(opts, done) {
  opts = opts || {};

  if (typeof opts === 'function') {
    done = opts;
    opts = {};
  }

  var Klass = null,
    result = null;

  Klass = module.exports.TrieAscoltatore;

  result = new Klass(opts, module.exports);

  if (opts.prefix) {
    result = new module.exports.PrefixAscoltatore(opts.prefix, result).once('error', done);
  }

  if (opts.json !== false) {
    result = new module.exports.JSONAscoltatore(result).once('error', done);
  }

  if (done) {
    setImmediate(function() {
      result.once('ready', function() {
        result.removeListener('error', done);
        done(null, result);
      });
    });
  }

  return result;
};

/**
 * These are just utilities
 *
 * @api private
 */
module.exports.util = util;

