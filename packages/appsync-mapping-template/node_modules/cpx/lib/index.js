/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

"use strict";

var Cpx = require("./cpx");

exports.Cpx = Cpx;

/**
 * Copies the files which match with a given glob pattern.
 *
 * @param {string} source - The glob pattern of source files.
 * @param {string} outDir - The path of an output directory.
 * @param {object} [options = null] - Omittable. An option object.
 * @param {boolean} [options.clean = false] - A flag to remove files that have
 *      been copied previously before copy.
 * @param {boolean} [options.dereference = false] - A flag to follow symbolic
 *      links.
 * @param {function[]} [options.transform = null] - Functions to make transform
 *      streams for each file.
 * @param {function} [cb = null] - A callback function to be called after done.
 * @returns {Cpx} A Cpx instance.
 */
exports.copy = function copy(source, outDir) {
    var options = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];
    var cb = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

    if (typeof options === "function") {
        /* eslint-disable no-param-reassign */
        cb = options;
        options = null;
        /* eslint-enable no-param-reassign */
    }

    var cpx = new Cpx(source, outDir, options);
    if (options && options.clean) {
        cpx.clean(function (err) {
            if (err == null) {
                cpx.copy(cb);
            } else if (cb != null) {
                cb(err);
            }
        });
    } else {
        cpx.copy(cb);
    }

    return cpx;
};

/**
 * Copies the files which match with a given glob pattern.
 *
 * @param {string} source - The glob pattern of source files.
 * @param {string} outDir - The path of an output directory.
 * @param {object} [options = null] - Omittable. An option object.
 * @param {boolean} [options.clean = false] - A flag to remove files that have
 *      been copied previously before copy.
 * @param {boolean} [options.dereference = false] - A flag to follow symbolic
 *      links.
 * @returns {Cpx} A Cpx instance.
 */
exports.copySync = function copySync(source, outDir) {
    var options = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

    var cpx = new Cpx(source, outDir, options);
    if (options && options.clean) {
        cpx.cleanSync();
    }
    cpx.copySync();
};

/**
 * Copies the files which match with a given glob pattern.
 * Then this observes the files and copies when modified them.
 *
 * @param {string} source - The glob pattern of source files.
 * @param {string} outDir - The path of an output directory.
 * @param {object} [options = null] - Omittable. An option object.
 * @param {boolean} [options.clean = false] - A flag to remove files that have
 *      been copied previously before copy.
 * @param {boolean} [options.dereference = false] - A flag to follow symbolic
 *      links.
 * @returns {Cpx} A Cpx instance.
 */
exports.watch = function watch(source, outDir) {
    var options = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

    var cpx = new Cpx(source, outDir, options);
    if (options && options.clean) {
        cpx.clean(function (err) {
            if (err == null) {
                cpx.watch();
            } else {
                cpx.emit("watch-error", err);
            }
        });
    } else {
        cpx.watch();
    }

    return cpx;
};