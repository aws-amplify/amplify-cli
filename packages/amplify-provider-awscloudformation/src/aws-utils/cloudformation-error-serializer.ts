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
  const errorMessages = {
    messages: eventsWithFailure.map((event) => {
      const name = `${event.LogicalResourceId} (${event.ResourceType})`;
      const eventType = `${getStatusToErrorMsg(event.ResourceStatus)}`;
      const reason = `${event.ResourceStatusReason}`;
      const errorMessage: CFNErrorMessage = { name, eventType, reason };
      return errorMessage;
    }),
  };
  return serializeErrorMessages(errorMessages);
};

export const serializeErrorMessages = (errorMessages: CFNErrorMessages) => {
  const serializedStringParts: Array<string> = [];
  errorMessages.messages.forEach((errorMessage) => {
    let currentString = `Name: ${errorMessage.name}, `;
    currentString += `Event Type: ${errorMessage.eventType}, `;
    currentString += `Reason: ${errorMessage.reason}\n`;
    serializedStringParts.push(currentString);
  });
  return serializedStringParts.join('\n');
};

export const deserializeErrorMessages = (errorDetails: string): CFNErrorMessages => {
  const deserializedMessages: CFNErrorMessages = { messages: [] };
  const separateLines = errorDetails.split('\n');
  separateLines.forEach((line) => {
    const separateFields = line.split(/Name: |, Event Type: |, Reason: /);
    const [, name, eventType, reason] = separateFields;
    if (name && eventType && reason) {
      const deserializedMessage: CFNErrorMessage = { name, eventType, reason };
      deserializedMessages.messages.push(deserializedMessage);
    }
  });
  return deserializedMessages;
};

export type CFNErrorMessage = {
  name: string;
  eventType: string;
  reason: string;
};

export type CFNErrorMessages = {
  messages: Array<CFNErrorMessage>;
};
