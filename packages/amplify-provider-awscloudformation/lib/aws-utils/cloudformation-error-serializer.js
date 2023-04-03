"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeErrorMessages = exports.serializeErrorMessages = exports.collectStackErrorMessages = exports.getStatusToErrorMsg = void 0;
const getStatusToErrorMsg = (status) => {
    const MAP = {
        CREATE_FAILED: 'create',
        DELETE_FAILED: 'delete',
        UPDATE_FAILED: 'update',
    };
    return MAP[status] || status;
};
exports.getStatusToErrorMsg = getStatusToErrorMsg;
const collectStackErrorMessages = (eventsWithFailure) => {
    const errorMessages = {
        messages: eventsWithFailure.map((event) => {
            const name = `${event.LogicalResourceId} (${event.ResourceType})`;
            const eventType = `${(0, exports.getStatusToErrorMsg)(event.ResourceStatus)}`;
            const reason = `${event.ResourceStatusReason}`;
            const errorMessage = { name, eventType, reason };
            return errorMessage;
        }),
    };
    return (0, exports.serializeErrorMessages)(errorMessages);
};
exports.collectStackErrorMessages = collectStackErrorMessages;
const serializeErrorMessages = (errorMessages) => {
    const serializedStringParts = [];
    errorMessages.messages.forEach((errorMessage) => {
        let currentString = `Name: ${errorMessage.name}, `;
        currentString += `Event Type: ${errorMessage.eventType}, `;
        currentString += `Reason: ${errorMessage.reason}\n`;
        serializedStringParts.push(currentString);
    });
    return serializedStringParts.join('\n');
};
exports.serializeErrorMessages = serializeErrorMessages;
const deserializeErrorMessages = (errorDetails) => {
    const deserializedMessages = { messages: [] };
    const separateLines = errorDetails.split('\n');
    separateLines.forEach((line) => {
        const separateFields = line.split(/Name: |, Event Type: |, Reason: /);
        const [, name, eventType, reason] = separateFields;
        if (name && eventType && reason) {
            const deserializedMessage = { name, eventType, reason };
            deserializedMessages.messages.push(deserializedMessage);
        }
    });
    return deserializedMessages;
};
exports.deserializeErrorMessages = deserializeErrorMessages;
//# sourceMappingURL=cloudformation-error-serializer.js.map