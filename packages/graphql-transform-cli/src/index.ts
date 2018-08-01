#!/usr/bin/env node
import 'babel-polyfill'
import * as Path from 'path';
import { CLI, Shim } from 'clime';

// The second parameter is the path to folder that contains command modules.
let cli = new CLI('appsync', Path.join(__dirname, 'commands'));

// Clime in its core provides an object-based command-line infrastructure.
// To have it work as a common CLI, a shim needs to be applied:
let shim = new Shim(cli);
shim.execute(process.argv);
