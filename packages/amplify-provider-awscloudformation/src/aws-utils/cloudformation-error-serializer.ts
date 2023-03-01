export const getStatusToErrorMsg = (status) => {
  const MAP = {
    CREATE_FAILED: 'create',
    DELETE_FAILED: 'delete',
    UPDATE_FAILED: 'update',
  };
  return MAP[status] || status;
};

/**
 * Return an error message from the failed stacks for populating it in the AmplifyFault's details
 */
export const collectStackErrorMessages = (eventsWithFailure) => {
  const errorMessages = eventsWithFailure.map((event) => {
    const err = [];
    const resourceName = event.LogicalResourceId;
    err.push(`Name: ${resourceName} (${event.ResourceType})`);
    err.push(`Event Type: ${getStatusToErrorMsg(event.ResourceStatus)}`);
    err.push(`Reason: ${event.ResourceStatusReason}`);
    return err.join(', ');
  });
  return errorMessages.join('\n');
};

export const serializeErrorMessages = (errorMessages: ErrorMessages) => {
  const serializedStringParts: Array<string> = [];
  errorMessages.messages.forEach((errorMessage) => {
    let currentString = `Name: ${errorMessage.name}, `;
    currentString += `Event Type: ${errorMessage.eventType}, `;
    currentString += `Reason: ${errorMessage.reason}\n`;
    serializedStringParts.push(currentString);
  });
  return serializedStringParts.join('\n');
};

export const deserializeErrorMessages = (errorDetails: string): ErrorMessages => {
  const deserializedMessages: ErrorMessages = { messages: [] };
  const separateLines = errorDetails.split('\n');
  separateLines.forEach((line) => {
    const separateFields = line.split(/Name: |, Event Type: |, Reason: /);
    const [, name, eventType, reason] = separateFields;
    const deserializedMessage: ErrorMessage = { name, eventType, reason };
    deserializedMessages.messages.push(deserializedMessage);
  });
  return deserializedMessages;
};

export type ErrorMessage = {
  name: string;
  eventType: string;
  reason: string;
};

export type ErrorMessages = {
  messages: Array<ErrorMessage>;
};
