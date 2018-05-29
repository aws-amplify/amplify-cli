"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../core");
const Net = require("net");
exports.ip = (value, { name }) => {
    if (!Net.isIP(value)) {
        throw new core_1.ExpectedError(`Value (${value}) of "${name}" is not a valid IP address`);
    }
};
exports.ipv4 = (value, { name }) => {
    if (!Net.isIPv4(value)) {
        throw new core_1.ExpectedError(`Value (${value}) of "${name}" is not a valid IPv4 address`);
    }
};
exports.ipv6 = (value, { name }) => {
    if (!Net.isIPv6(value)) {
        throw new core_1.ExpectedError(`Value (${value}) of "${name}" is not a valid IPv6 address`);
    }
};
//# sourceMappingURL=network.js.map