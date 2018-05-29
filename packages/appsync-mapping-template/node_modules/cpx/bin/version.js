/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
/* eslint no-console:0 */

"use strict";

/**
 * Reads `package.json` then returns the version text.
 *
 * @param {string} path - The path of `package.json`.
 * @returns {string|null} The version text.
 */

function get(path) {
    try {
        return require(path).version;
    } catch (_err) {
        return null;
    }
}

/**
 * Prints the version text.
 *
 * @returns {void}
 */
module.exports = function version() {
    console.log("v" + (get("../package.json") || get("../../package.json")));
};