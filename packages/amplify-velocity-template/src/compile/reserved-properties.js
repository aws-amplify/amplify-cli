'use strict';

// Prototype-chain names that templates must not read or write, shared by
// reference resolution (references.js) and #set (set.js). Keeping one list
// stops the copies drifting apart when a name is added to only one of them.
var BLOCKED_PROPERTIES = [
  'constructor',
  '__proto__',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
];

/**
 * Determine whether a property name traverses the JavaScript prototype
 * chain (e.g. constructor/__proto__/prototype) and must be blocked so it
 * cannot be used to reach the Function constructor and escape the template
 * sandbox.
 * @param {string} name property name being resolved
 * @returns {boolean} true when the name is disallowed
 */
function isBlockedProperty(name) {
  return isBlockedKey(toPropertyKey(name));
}

// Convert a template key to the primitive the property access will use.
function toPropertyKey(key) {
  return typeof key === 'string' || typeof key === 'number' || typeof key === 'symbol' ? key : String(key);
}

function isBlockedKey(key) {
  return typeof key === 'string' && BLOCKED_PROPERTIES.indexOf(key) !== -1;
}

/**
 * Guarded read: route template-controlled property reads through this so a
 * new read path is protected by construction instead of by remembering to
 * call isBlockedProperty.
 * @param {object} base object being read
 * @param {string|number} key property name or index from the template
 * @returns {*} base[key], or undefined when the key is blocked
 */
function safeGetProperty(base, key) {
  var k = toPropertyKey(key);
  return isBlockedKey(k) ? undefined : base[k];
}

/**
 * Guarded write: route template-controlled property writes through this.
 * @param {object} base object being written
 * @param {string|number} key property name from the template
 * @param {*} value value to assign
 * @returns {boolean} true if written, false if the key was blocked
 */
function safeSetProperty(base, key, value) {
  var k = toPropertyKey(key);
  if (isBlockedKey(k)) {
    return false;
  }
  base[k] = value;
  return true;
}

module.exports = {
  BLOCKED_PROPERTIES: BLOCKED_PROPERTIES,
  isBlockedProperty: isBlockedProperty,
  toPropertyKey: toPropertyKey,
  safeGetProperty: safeGetProperty,
  safeSetProperty: safeSetProperty,
};
