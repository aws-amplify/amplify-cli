"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGE_TYPES = void 0;
var MESSAGE_TYPES;
(function (MESSAGE_TYPES) {
    MESSAGE_TYPES["GQL_CONNECTION_INIT"] = "connection_init";
    MESSAGE_TYPES["GQL_CONNECTION_ERROR"] = "connection_error";
    MESSAGE_TYPES["GQL_CONNECTION_ACK"] = "connection_ack";
    MESSAGE_TYPES["GQL_START"] = "start";
    MESSAGE_TYPES["GQL_START_ACK"] = "start_ack";
    MESSAGE_TYPES["GQL_DATA"] = "data";
    MESSAGE_TYPES["GQL_CONNECTION_KEEP_ALIVE"] = "ka";
    MESSAGE_TYPES["GQL_STOP"] = "stop";
    MESSAGE_TYPES["GQL_COMPLETE"] = "complete";
    MESSAGE_TYPES["GQL_ERROR"] = "error";
})(MESSAGE_TYPES = exports.MESSAGE_TYPES || (exports.MESSAGE_TYPES = {}));
//# sourceMappingURL=message-types.js.map