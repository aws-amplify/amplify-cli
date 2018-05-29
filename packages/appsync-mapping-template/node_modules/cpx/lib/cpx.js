/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

"use strict";

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _setImmediate2 = require("babel-runtime/core-js/set-immediate");

var _setImmediate3 = _interopRequireDefault(_setImmediate2);

var _getPrototypeOf = require("babel-runtime/core-js/object/get-prototype-of");

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _symbol = require("babel-runtime/core-js/symbol");

var _symbol2 = _interopRequireDefault(_symbol);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require("events");

var EventEmitter = _require.EventEmitter;

var fs = require("fs");

var _require2 = require("path");

var dirname = _require2.dirname;
var resolvePath = _require2.resolve;
var relativePath = _require2.relative;
var joinPath = _require2.join;

var _require3 = require("chokidar");

var createWatcher = _require3.watch;

var _require4 = require("glob");

var Glob = _require4.Glob;
var searchSync = _require4.sync;

var getBasePath = require("glob2base");
var mkdir = require("mkdirp");
var mkdirSync = mkdir.sync;

var _require5 = require("minimatch");

var Minimatch = _require5.Minimatch;

var copyFile = require("./copy");
var copyFileSync = require("./copy-sync");
var Queue = require("./queue");

var BASE_DIR = (0, _symbol2.default)("baseDir");
var DEREFERENCE = (0, _symbol2.default)("dereference");
var INCLUDE_EMPTY_DIRS = (0, _symbol2.default)("include-empty-dirs");
var INITIAL_COPY = (0, _symbol2.default)("initialCopy");
var OUT_DIR = (0, _symbol2.default)("outDir");
var PRESERVE = (0, _symbol2.default)("preserve");
var SOURCE = (0, _symbol2.default)("source");
var TRANSFORM = (0, _symbol2.default)("transform");
var UPDATE = (0, _symbol2.default)("update");
var QUEUE = (0, _symbol2.default)("queue");
var WATCHER = (0, _symbol2.default)("watcher");

/**
 * Converts a file path to use glob.
 * Glob doesn't support the delimiter of Windows.
 *
 * @param {string} path - A path to convert.
 * @returns {string} The normalized path.
 */
function normalizePath(path) {
    if (path == null) {
        return null;
    }

    var normalizedPath = relativePath(process.cwd(), resolvePath(path));
    normalizedPath = normalizedPath.replace(/\\/g, "/");
    if (/\/$/.test(normalizedPath)) {
        normalizedPath = normalizedPath.slice(0, -1);
    }
    return normalizedPath || ".";
}

/**
 * Applys a given action for each file that matches with a given pattern.
 *
 * @param {Cpx} cpx - An instance.
 * @param {string} pattern - A pattern to find files.
 * @param {function} action - A predicate function to apply.
 * @returns {void}
 */
function doAllSimply(cpx, pattern, action) {
    new Glob(pattern, { nodir: !cpx.includeEmptyDirs, silent: true }).on("match", action.bind(cpx));
}

/**
 * Applys a given action for each file that matches with a given pattern.
 * Then calls a given callback function after done.
 *
 * @param {Cpx} cpx - An instance.
 * @param {string} pattern - A pattern to find files.
 * @param {function} action - A predicate function to apply.
 * @param {function} cb - A callback function.
 * @returns {void}
 */
function doAll(cpx, pattern, action, cb) {
    if (cb == null) {
        doAllSimply(cpx, pattern, action);
        return;
    }

    var count = 0;
    var done = false;
    var lastError = null;

    /**
     * Calls the callback function if done.
     * @returns {void}
     */
    function cbIfEnd() {
        if (done && count === 0) {
            cb(lastError);
        }
    }

    new Glob(pattern, {
        nodir: !cpx.includeEmptyDirs,
        silent: true,
        follow: cpx.dereference
    }).on("match", function (path) {
        if (lastError != null) {
            return;
        }

        count += 1;
        action.call(cpx, path, function (err) {
            count -= 1;
            lastError = lastError || err;
            cbIfEnd();
        });
    }).on("end", function () {
        done = true;
        cbIfEnd();
    }).on("error", function (err) {
        lastError = lastError || err;
    });
}

module.exports = function (_EventEmitter) {
    (0, _inherits3.default)(Cpx, _EventEmitter);

    /**
     * @param {string} source - A blob for copy files.
     * @param {string} outDir - A file path for the destination directory.
     * @param {object} options - An options object.
     */
    function Cpx(source, outDir, options) {
        (0, _classCallCheck3.default)(this, Cpx);

        options = options || {}; // eslint-disable-line no-param-reassign

        var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(Cpx).call(this));

        _this[SOURCE] = normalizePath(source);
        _this[OUT_DIR] = normalizePath(outDir);
        _this[DEREFERENCE] = Boolean(options.dereference);
        _this[INCLUDE_EMPTY_DIRS] = Boolean(options.includeEmptyDirs);
        _this[INITIAL_COPY] = options.initialCopy === undefined || Boolean(options.initialCopy);
        _this[PRESERVE] = Boolean(options.preserve);
        _this[TRANSFORM] = [].concat(options.transform).filter(Boolean);
        _this[UPDATE] = Boolean(options.update);
        _this[QUEUE] = new Queue();
        _this[BASE_DIR] = null;
        _this[WATCHER] = null;
        return _this;
    }

    //==========================================================================
    // Commons
    //--------------------------------------------------------------------------

    /**
     * The source file glob to copy.
     * @type {string}
     */


    (0, _createClass3.default)(Cpx, [{
        key: "src2dst",


        /**
         * Convert a glob from source to destination.
         *
         * @param {string} path - A path to convert.
         * @returns {string} The converted path.
         */
        value: function src2dst(path) {

            if (this.base === ".") {
                return joinPath(this.outDir, path);
            }
            return path.replace(this.base, this.outDir);
        }

        /**
         * Copy a file.
         *
         * @param {string} srcPath - A file path to copy.
         * @param {function} [cb = null] - A callback function.
         * @returns {void}
         */

    }, {
        key: "enqueueCopy",
        value: function enqueueCopy(srcPath) {
            var _this2 = this;

            var cb = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];


            var dstPath = this.src2dst(srcPath);
            if (dstPath === srcPath) {
                if (cb != null) {
                    (0, _setImmediate3.default)(cb, null);
                    return;
                }
            }

            this[QUEUE].push(function (next) {
                mkdir(dirname(dstPath), next);
            });
            this[QUEUE].push(function (next) {
                copyFile(srcPath, dstPath, _this2, function (err) {
                    if (err == null) {
                        _this2.emit("copy", { srcPath: srcPath, dstPath: dstPath });
                    }

                    next();
                    if (cb != null) {
                        cb(err || null);
                    }
                });
            });
        }

        /**
         * Remove a file.
         *
         * @param {string} path - A file path to remove.
         * @param {function} [cb = null] - A callback function.
         * @returns {void}
         */

    }, {
        key: "enqueueRemove",
        value: function enqueueRemove(path) {
            var _this3 = this;

            var cb = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];


            var lastError = null;
            var stat = null;
            this[QUEUE].push(function (next) {
                fs.stat(path, function (err, result) {
                    lastError = err;
                    stat = result;
                    next();
                });
            });
            this[QUEUE].push(function (next) {
                if (stat && stat.isDirectory()) {
                    fs.rmdir(path, function (err) {
                        if (err == null) {
                            _this3.emit("remove", { path: path });
                        }

                        lastError = err;
                        next();
                    });
                } else {
                    fs.unlink(path, function (err) {
                        if (err == null) {
                            _this3.emit("remove", { path: path });
                        }

                        lastError = err;
                        next();
                    });
                }
            });
            this[QUEUE].push(function (next) {
                fs.rmdir(dirname(path), function () {
                    next();
                    if (cb != null) {
                        cb(lastError);
                    }
                });
            });
        }

        //==========================================================================
        // Clean Methods
        //--------------------------------------------------------------------------

        /**
         * Remove all files that matches `this.source` like pattern in `this.dest`
         * directory.
         * @param {function} [cb = null] - A callback function.
         * @returns {void}
         */

    }, {
        key: "clean",
        value: function clean() {
            var cb = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];


            var dest = this.src2dst(this.source);
            if (dest === this.source) {
                if (cb != null) {
                    (0, _setImmediate3.default)(cb, null);
                }
                return;
            }

            doAll(this, dest, this.enqueueRemove, cb);
        }

        /**
         * Remove all files that matches `this.source` like pattern in `this.dest`
         * directory.
         * @returns {void}
         * @thrpws {Error} IO error.
         */

    }, {
        key: "cleanSync",
        value: function cleanSync() {
            var dest = this.src2dst(this.source);
            if (dest === this.source) {
                return;
            }

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = (0, _getIterator3.default)(searchSync(dest, {
                    nodir: !this.includeEmptyDirs,
                    silent: true
                })), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var path = _step.value;

                    try {
                        var stat = fs.statSync(path);
                        if (stat.isDirectory()) {
                            fs.rmdirSync(path);
                        } else {
                            fs.unlinkSync(path);
                        }
                    } catch (err) {
                        if (err.code !== "ENOENT") {
                            throw err;
                        }
                    }

                    try {
                        fs.rmdirSync(dirname(path));
                    } catch (err) {
                        if (err.code !== "ENOTEMPTY") {
                            throw err;
                        }
                    }

                    this.emit("remove", { path: path });
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }

        //============================================================================
        // Copy Methods
        //----------------------------------------------------------------------------

        /**
         * Copy all files that matches `this.source` pattern to `this.outDir`.
         *
         * @param {function} [cb = null] - A callback function.
         * @returns {void}
         */

    }, {
        key: "copy",
        value: function copy() {
            var cb = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];


            doAll(this, this.source, this.enqueueCopy, cb);
        }

        /**
         * Copy all files that matches `this.source` pattern to `this.outDir`.
         *
         * @returns {void}
         * @thrpws {Error} IO error.
         */

    }, {
        key: "copySync",
        value: function copySync() {
            var _this4 = this;

            if (this.transformFactories.length > 0) {
                throw new Error("Synchronous copy can't use the transform option.");
            }

            var srcPaths = searchSync(this.source, {
                nodir: !this.includeEmptyDirs,
                silent: true,
                follow: this.dereference
            });
            srcPaths.forEach(function (srcPath) {
                var dstPath = _this4.src2dst(srcPath);
                if (dstPath === srcPath) {
                    return;
                }

                mkdirSync(dirname(dstPath));
                copyFileSync(srcPath, dstPath, _this4);

                _this4.emit("copy", { srcPath: srcPath, dstPath: dstPath });
            });
        }

        //============================================================================
        // Watch Methods
        //----------------------------------------------------------------------------

        /**
         * Copy all files that matches `this.source` pattern to `this.outDir`.
         * And watch changes in `this.base`, and copy only the file every time.
         *
         * @returns {void}
         * @throws {Error} This had been watching already.
         */

    }, {
        key: "watch",
        value: function watch() {
            var _this5 = this;

            if (this[WATCHER] != null) {
                throw new Error("InvalidStateError");
            }

            var m = new Minimatch(this.source);

            var firstCopyCount = 0;
            var ready = false;
            var fireReadyIfReady = function fireReadyIfReady() {
                if (ready && firstCopyCount === 0) {
                    _this5.emit("watch-ready");
                }
            };

            var onAdded = function onAdded(path) {
                var normalizedPath = normalizePath(path);
                if (m.match(normalizedPath)) {
                    if (ready) {
                        _this5.enqueueCopy(normalizedPath);
                    } else if (_this5.initialCopy) {
                        firstCopyCount += 1;
                        _this5.enqueueCopy(normalizedPath, function () {
                            firstCopyCount -= 1;
                            fireReadyIfReady();
                        });
                    }
                }
            };
            var onRemoved = function onRemoved(path) {
                var normalizedPath = normalizePath(path);
                if (m.match(normalizedPath)) {
                    var dstPath = _this5.src2dst(normalizedPath);
                    if (dstPath !== normalizedPath) {
                        _this5.enqueueRemove(dstPath);
                    }
                }
            };

            this[WATCHER] = createWatcher(this.base, {
                cwd: process.cwd(),
                persistent: true,
                followSymlinks: this.dereference
            });

            this[WATCHER].on("add", onAdded).on("addDir", onAdded).on("unlink", onRemoved).on("unlinkDir", onRemoved).on("change", function (path) {
                var normalizedPath = normalizePath(path);
                if (m.match(normalizedPath)) {
                    _this5.enqueueCopy(normalizedPath);
                }
            }).on("ready", function () {
                ready = true;
                fireReadyIfReady();
            }).on("error", function (err) {
                _this5.emit("watch-error", err);
            });
        }

        /**
         * Stop watching.
         *
         * @returns {void}
         */

    }, {
        key: "unwatch",
        value: function unwatch() {
            if (this[WATCHER] != null) {
                this[WATCHER].close();
                this[WATCHER] = null;
            }
        }

        /**
         * Stop watching.
         *
         * @returns {void}
         */

    }, {
        key: "close",
        value: function close() {
            this.unwatch();
        }
    }, {
        key: "source",
        get: function get() {
            return this[SOURCE];
        }

        /**
         * The destination directory to copy.
         * @type {string}
         */

    }, {
        key: "outDir",
        get: function get() {
            return this[OUT_DIR];
        }

        /**
         * The flag to follow symbolic links.
         * @type {boolean}
         */

    }, {
        key: "dereference",
        get: function get() {
            return this[DEREFERENCE];
        }

        /**
         * The flag to copy empty directories which is matched with the glob.
         * @type {boolean}
         */

    }, {
        key: "includeEmptyDirs",
        get: function get() {
            return this[INCLUDE_EMPTY_DIRS];
        }

        /**
         * The flag to copy files at the initial time of watch.
         * @type {boolean}
         */

    }, {
        key: "initialCopy",
        get: function get() {
            return this[INITIAL_COPY];
        }

        /**
         * The flag to copy file attributes.
         * @type {boolean}
         */

    }, {
        key: "preserve",
        get: function get() {
            return this[PRESERVE];
        }

        /**
         * The factories of transform streams.
         * @type {function[]}
         */

    }, {
        key: "transformFactories",
        get: function get() {
            return this[TRANSFORM];
        }

        /**
         * The flag to disallow overwriting.
         * @type {boolean}
         */

    }, {
        key: "update",
        get: function get() {
            return this[UPDATE];
        }

        /**
         * The base directory of `this.source`.
         * @type {string}
         */

    }, {
        key: "base",
        get: function get() {
            if (this[BASE_DIR] == null) {
                this[BASE_DIR] = normalizePath(getBasePath(new Glob(this.source)));
            }
            return this[BASE_DIR];
        }
    }]);
    return Cpx;
}(EventEmitter);