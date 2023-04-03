"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSubscriptionConnectionInitMessage = exports.isSubscriptionStopMessage = exports.isSubscriptionStartMessage = exports.GQLMessageExtractionError = void 0;
const message_types_1 = require("./message-types");
class GQLMessageExtractionError extends Error {
}
exports.GQLMessageExtractionError = GQLMessageExtractionError;
function isSubscriptionStartMessage(message) {
    if (!message)
        return false;
    if (message.type !== message_types_1.MESSAGE_TYPES.GQL_START)
        return false;
    if (!message.id)
        return false;
    if (!(message.payload && message.payload.data))
        return false;
    try {
        const dataJson = JSON.parse(message.payload.data);
        if (!dataJson.query)
            return false;
    }
    catch (e) {
        return false;
    }
    if (!(message.payload && message.payload.extensions && message.payload.extensions.authorization))
        return false;
    return true;
}
exports.isSubscriptionStartMessage = isSubscriptionStartMessage;
function isSubscriptionStopMessage(message) {
    if (!message)
        return false;
    if (message.type !== message_types_1.MESSAGE_TYPES.GQL_STOP)
        return false;
    if (!message.id)
        return false;
    return true;
}
exports.isSubscriptionStopMessage = isSubscriptionStopMessage;
function isSubscriptionConnectionInitMessage(message) {
    if (!message)
        return false;
    if (message.type !== message_types_1.MESSAGE_TYPES.GQL_CONNECTION_INIT)
        return false;
    return true;
}
exports.isSubscriptionConnectionInitMessage = isSubscriptionConnectionInitMessage;
//# sourceMappingURL=message-type-guards.js.map