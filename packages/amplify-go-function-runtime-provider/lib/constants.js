"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relativeShimSrcPath = exports.packageName = exports.MAX_PORT = exports.BASE_PORT = exports.MAIN_BINARY_WIN = exports.MAIN_BINARY = exports.MAIN_SOURCE = exports.DIST = exports.SRC = exports.BIN = exports.BIN_LOCAL = void 0;
const path_1 = require("path");
exports.BIN_LOCAL = 'bin-local';
exports.BIN = 'bin';
exports.SRC = 'src';
exports.DIST = 'dist';
exports.MAIN_SOURCE = 'main.go';
exports.MAIN_BINARY = 'main';
exports.MAIN_BINARY_WIN = 'main.exe';
exports.BASE_PORT = 8900;
exports.MAX_PORT = 9999;
exports.packageName = 'amplify-go-function-runtime-provider';
exports.relativeShimSrcPath = (0, path_1.join)('resources', 'localinvoke');
//# sourceMappingURL=constants.js.map