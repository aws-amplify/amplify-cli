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

module.exports = {
  BLOCKED_PROPERTIES: BLOCKED_PROPERTIES,
  isBlockedProperty: isBlockedProperty,
};
