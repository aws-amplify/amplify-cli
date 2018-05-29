"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("./lang");
__export(require("./core"));
__export(require("./shim"));
const Castable = require("./castable");
exports.Castable = Castable;
exports.Object = Castable;
const Validation = require("./validation");
exports.Validation = Validation;
//# sourceMappingURL=index.js.map