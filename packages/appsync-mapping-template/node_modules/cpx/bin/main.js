/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
/* eslint no-console:0, no-process-exit:0, no-process-env:0 */

"use strict";

var _create = require("babel-runtime/core-js/object/create");

var _create2 = _interopRequireDefault(_create);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require("path");

var resolvePath = _require.resolve;

var _require2 = require("child_process");

var spawn = _require2.spawn;

var _require3 = require("resolve");

var resolveModule = _require3.sync;

var _require4 = require("shell-quote");

var parseShellQuote = _require4.parse;

var duplexer = require("duplexer");
var Cpx = require("../lib/cpx");

module.exports = function main(source, outDir, args) {
    //--------------------------------------------------------------------------
    // Resolve Command.
    var commands = [].concat(args.command).filter(Boolean).map(function (command) {
        if (typeof command !== "string") {
            console.error("Invalid --command option");
            process.exit(1);
        }

        return function (file) {
            var env = (0, _create2.default)(process.env, { FILE: { value: file } });
            var parts = parseShellQuote(command, env);
            var child = spawn(parts[0], parts.slice(1), { env: env });
            var outer = duplexer(child.stdin, child.stdout);
            child.on("exit", function (code) {
                if (code !== 0) {
                    var error = new Error("non-zero exit code in command: " + command);
                    outer.emit("error", error);
                }
            });
            child.stderr.pipe(process.stderr);

            return outer;
        };
    });

    //--------------------------------------------------------------------------
    // Resolve Transforms.
    var ABS_OR_REL = /^[.\/]/;
    var transforms = [].concat(args.transform).filter(Boolean).map(function (arg) {
        // eslint-disable-line array-callback-return,consistent-return
        if (typeof arg === "string") {
            return { name: arg, argv: null };
        }
        if (typeof arg._[0] === "string") {
            return { name: arg._.shift(), argv: arg };
        }

        console.error("Invalid --transform option");
        process.exit(1);
    }).map(function (item) {
        var createStream = ABS_OR_REL.test(item.name) ? require(resolvePath(item.name)) : require(resolveModule(item.name, { basedir: process.cwd() }));
        return function (file) {
            return createStream(file, item.argv);
        };
    });

    //--------------------------------------------------------------------------
    // Merge commands and transforms as same as order of process.argv.
    var C_OR_COMMAND = /^(?:-c|--command)$/;
    var T_OR_TRANSFORM = /^(?:-t|--transform)$/;
    var mergedTransformFactories = process.argv.map(function (part) {
        if (C_OR_COMMAND.test(part)) {
            return commands.shift();
        }
        if (T_OR_TRANSFORM.test(part)) {
            return transforms.shift();
        }
        return null;
    }).filter(Boolean);

    //--------------------------------------------------------------------------
    // Main.
    var cpx = new Cpx(source, outDir, {
        transform: mergedTransformFactories,
        dereference: args.dereference,
        includeEmptyDirs: args.includeEmptyDirs,
        initialCopy: args.initial,
        preserve: args.preserve,
        update: args.update
    });
    if (args.verbose) {
        cpx.on("copy", function (event) {
            console.log("Copied: " + event.srcPath + " --> " + event.dstPath);
        });
        cpx.on("remove", function (event) {
            console.log("Removed: " + event.path);
        });
    }

    if (args.clean) {
        if (args.verbose) {
            console.log();
            console.log("Clean: " + cpx.src2dst(cpx.source));
            console.log();
        }
        try {
            cpx.cleanSync();
        } catch (err) {
            console.error("Failed to clean: " + err.message + ".");
            process.exit(1);
        }
        if (args.verbose) {
            console.log();
            console.log("Copy: " + source + " --> " + outDir);
            console.log();
        }
    }

    if (args.watch) {
        if (args.verbose) {
            cpx.on("watch-ready", function () {
                console.log();
                console.log("Be watching in " + cpx.base);
                console.log();
            });
        }
        cpx.on("watch-error", function (err) {
            console.error(err.message);
        });

        // In order to kill me by test harness on Windows.
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", function (chunk) {
            if (chunk === "KILL") {
                process.exit(0);
            }
        });

        cpx.watch();
    } else {
        cpx.copy(function (err) {
            if (err) {
                console.error("Failed to copy: " + err.message + ".");
                process.exit(1);
            }
        });
    }
};