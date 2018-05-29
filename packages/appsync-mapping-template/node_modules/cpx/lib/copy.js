/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

"use strict";

var fs = require("fs");
var mkdir = require("mkdirp");
var Queue = require("./queue");

/**
 * @param {string} src - A path of the source file.
 * @param {string} dst - A path of the destination file.
 * @param {function[]} transformFactories - Factory functions for transform streams.
 * @param {function} cb - A callback function that called after copied.
 * @returns {void}
 * @private
 */
function copyBody(src, dst, transformFactories, cb) {
    var reader = fs.createReadStream(src);
    var writer = fs.createWriteStream(dst);
    var streams = [reader];

    /**
     * Clean up.
     * @param {Error|undefined} err - An error or undefined.
     * @returns {void}
     */
    function next(err) {
        try {
            streams.forEach(function (s) {
                s.removeListener("error", next);
                if (typeof s.destroy === "function") {
                    s.destroy();
                }
            });
            writer.removeListener("error", next);
            writer.removeListener("finish", next);
        } catch (cleanupErr) {
            cb(err || cleanupErr);
            return;
        }

        cb(err);
    }

    reader.on("error", next);
    writer.on("error", next);
    writer.on("finish", next);

    try {
        transformFactories.reduce(function (input, factory) {
            var t = factory(src);
            t.on("error", next);
            streams.push(t);

            return input.pipe(t);
        }, reader).pipe(writer);
    } catch (err) {
        next(err);
    }
}

/**
 * @param {string} src - A path of the source file.
 * @param {string} dst - A path of the destination file.
 * @param {object} options - Options.
 * @param {function[]} options.transformFactories - Factory functions for transform streams.
 * @param {boolean} options.preserve - The flag to copy attributes.
 * @param {boolean} options.update - The flag to disallow overwriting.
 * @param {function} cb - A callback function that called after copied.
 * @returns {void}
 * @private
 */
module.exports = function copy(src, dst, _ref, cb) {
    var transformFactories = _ref.transformFactories;
    var preserve = _ref.preserve;
    var update = _ref.update;

    var q = new Queue();
    var stat = null;

    q.push(function (next) {
        return fs.stat(src, function (err, result) {
            if (err) {
                cb(err);
            } else {
                stat = result;
                next();
            }
        });
    });
    if (update) {
        q.push(function (next) {
            return fs.stat(dst, function (err, dstStat) {
                if (!err && dstStat.mtime.getTime() > stat.mtime.getTime()) {
                    // Don't overwrite because the file on destination is newer than
                    // the source file.
                    cb(null);
                } else {
                    next();
                }
            });
        });
    }

    q.push(function (next) {
        if (stat.isDirectory()) {
            mkdir(dst, function (err) {
                if (err) {
                    cb(err);
                } else {
                    next();
                }
            });
        } else {
            copyBody(src, dst, transformFactories, function (err) {
                if (err) {
                    cb(err);
                } else {
                    next();
                }
            });
        }
    });
    q.push(function (next) {
        return fs.chmod(dst, stat.mode, function (err) {
            if (err) {
                cb(err);
            } else {
                next();
            }
        });
    });

    if (preserve) {
        q.push(function (next) {
            return fs.chown(dst, stat.uid, stat.gid, function (err) {
                if (err) {
                    cb(err);
                } else {
                    next();
                }
            });
        });
        q.push(function (next) {
            return fs.utimes(dst, stat.atime, stat.mtime, function (err) {
                if (err) {
                    cb(err);
                } else {
                    next();
                }
            });
        });
    }

    q.push(function (next) {
        next();
        cb(null);
    });
};