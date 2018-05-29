#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("babel-polyfill");
const Path = require("path");
const clime_1 = require("clime");
// The second parameter is the path to folder that contains command modules.
let cli = new clime_1.CLI('appsync', Path.join(__dirname, 'commands'));
// Clime in its core provides an object-based command-line infrastructure.
// To have it work as a common CLI, a shim needs to be applied:
let shim = new clime_1.Shim(cli);
shim.execute(process.argv);
//# sourceMappingURL=index.js.map