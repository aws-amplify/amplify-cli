#!/usr/bin/env node


/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
/* eslint no-console:0, no-process-exit:0 */

"use strict";

var _from = require("babel-runtime/core-js/array/from");

var _from2 = _interopRequireDefault(_from);

var _set = require("babel-runtime/core-js/set");

var _set2 = _interopRequireDefault(_set);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var subarg = require("subarg");

//------------------------------------------------------------------------------
// Parse arguments.
var unknowns = new _set2.default();
var args = subarg(process.argv.slice(2), {
    alias: {
        c: "command",
        C: "clean",
        h: "help",
        includeEmptyDirs: "include-empty-dirs",
        L: "dereference",
        p: "preserve",
        t: "transform",
        u: "update",
        v: "verbose",
        V: "version",
        w: "watch"
    },
    boolean: ["clean", "dereference", "help", "include-empty-dirs", "initial", "preserve", "update", "verbose", "version", "watch"],
    default: { initial: true },
    unknown: function unknown(arg) {
        if (arg[0] === "-") {
            unknowns.add(arg);
        }
    }
});
var source = args._[0];
var outDir = args._[1];

//------------------------------------------------------------------------------
// Validate Options.
if (unknowns.size > 0) {
    console.error("Unknown option(s): " + (0, _from2.default)(unknowns).join(", "));
    process.exit(1);
}

//------------------------------------------------------------------------------
// Main.
if (args.help) {
    require("./help")();
} else if (args.version) {
    require("./version")();
} else if (source == null || outDir == null || args._.length > 2) {
    require("./help")();
    process.exit(1);
} else {
    require("./main")(source, outDir, args);
}