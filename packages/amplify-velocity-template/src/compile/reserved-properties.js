'use strict';

// Single source of truth for the prototype-chain denylist shared by every
// template-controlled property access path (reference resolution in
// references.js and #set directive writes in set.js). Keeping one list avoids
// the two copies drifting and silently reopening the prototype-pollution /
// sandbox-escape vector for a name added to only one copy.
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
  return typeof name === 'string' && BLOCKED_PROPERTIES.indexOf(name) !== -1;
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
  return isBlockedProperty(key) ? undefined : base[key];
}

/**
 * Guarded write: route template-controlled property writes through this.
 * @param {object} base object being written
 * @param {string|number} key property name from the template
 * @param {*} value value to assign
 * @returns {boolean} true if written, false if the key was blocked
 */
function safeSetProperty(base, key, value) {
  if (isBlockedProperty(key)) {
    return false;
  }
  base[key] = value;
  return true;
}

module.exports = {
  BLOCKED_PROPERTIES: BLOCKED_PROPERTIES,
  isBlockedProperty: isBlockedProperty,
  safeGetProperty: safeGetProperty,
  safeSetProperty: safeSetProperty,
};
