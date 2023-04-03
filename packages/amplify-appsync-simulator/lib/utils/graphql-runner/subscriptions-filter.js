"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterSubscriptions = void 0;
const util_1 = require("util");
const log = console;
function filterSubscriptions(payload, variables) {
    if (payload == null) {
        log.warn('Subscription payload is null; Publishing will be skipped');
        return false;
    }
    const variableEntries = Object.entries(variables || {});
    if (!variableEntries.length) {
        return true;
    }
    const variableResult = variableEntries.every(([variableKey, variableValue]) => payload[variableKey] === variableValue);
    if (!variableResult) {
        log.warn('Subscription payload did not match variables');
        log.warn('Payload:');
        log.warn((0, util_1.inspect)(payload));
        log.warn('Variables:');
        log.warn((0, util_1.inspect)(variables));
        return false;
    }
    return true;
}
exports.filterSubscriptions = filterSubscriptions;
//# sourceMappingURL=subscriptions-filter.js.map