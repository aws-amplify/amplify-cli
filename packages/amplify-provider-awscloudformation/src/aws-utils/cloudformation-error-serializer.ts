import { StackEvent } from '@aws-sdk/client-cloudformation';
export const getStatusToErrorMsg = (status) => {
  const MAP = {
    CREATE_FAILED: 'create',
    DELETE_FAILED: 'delete',
    UPDATE_FAILED: 'update',
  };
  return MAP[status] || status;
};

/**
 * Return an error message from the failed stacks for populating it in the AmplifyException's details
 */
export const collectStackErrorMessages = (eventsWithFailure: StackEvent[], customStackIds: string[]) => {
  const errorMessages = {
    messages: eventsWithFailure.map((event: StackEvent) => {
      const name = `${event.LogicalResourceId} (${event.ResourceType})`;
      const eventType = `${getStatusToErrorMsg(event.ResourceStatus)}`;
      const reason = `${event.ResourceStatusReason}`;
      const isCustomResource = customStackIds.includes(event.PhysicalResourceId) || customStackIds.includes(event.StackId);
      const errorMessage: CFNErrorMessage = { name, eventType, reason, isCustomResource };
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
    currentString += `Reason: ${errorMessage.reason}, `;
    currentString += `IsCustomResource: ${errorMessage.isCustomResource}\n`;
    serializedStringParts.push(currentString);
  });
  return serializedStringParts.join('\n');
};

export const deserializeErrorMessages = (errorDetails: string): CFNErrorMessages => {
  const deserializedMessages: CFNErrorMessages = { messages: [] };
  const separateLines = errorDetails?.split('\n');
  separateLines?.forEach((line) => {
    const separateFields = line.split(/Name: |, Event Type: |, Reason: |, IsCustomResource: /);
    const [, name, eventType, reason, isCustomResourceString] = separateFields;
    const isCustomResource = isCustomResourceString === 'true';
    if (name && eventType && reason) {
      const deserializedMessage: CFNErrorMessage = { name, eventType, reason, isCustomResource };
      deserializedMessages.messages.push(deserializedMessage);
    }
  });
  return deserializedMessages;
};

export type CFNErrorMessage = {
  name: string;
  eventType: string;
  reason: string;
  isCustomResource: boolean;
};

export type CFNErrorMessages = {
  messages: Array<CFNErrorMessage>;
};
