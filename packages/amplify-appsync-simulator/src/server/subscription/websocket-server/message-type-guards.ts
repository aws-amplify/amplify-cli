import { MESSAGE_TYPES } from './message-types';
export class GQLMessageExtractionError extends Error {}
export type GQLMessageGeneric = {
  type: MESSAGE_TYPES;
};
export type GQLMessageConnectionInit = GQLMessageGeneric & {
  type: MESSAGE_TYPES.GQL_CONNECTION_INIT;
};

export type GQLMessageConnectionAck = GQLMessageGeneric & {
  type: MESSAGE_TYPES.GQL_CONNECTION_ACK;
  payload: {
    connectionTimeout: number;
  };
};

export type GQLMessageKeepAlive = GQLMessageGeneric & {
  type: MESSAGE_TYPES.GQL_CONNECTION_KEEP_ALIVE;
};

export type GQLMessageSubscriptionStart = GQLMessageGeneric & {
  type: MESSAGE_TYPES.GQL_START;
  id: string;
  payload: {
    data: string;
    extensions: {
      authorization: {
        Authorization: string;
        host: string;
      };
    };
  };
};
export type GQLMessageSubscriptionAck = GQLMessageGeneric & {
  type: MESSAGE_TYPES.GQL_START_ACK;
  id: string;
};

export type GQLMessageSubscriptionStop = GQLMessageGeneric & {
  type: MESSAGE_TYPES.GQL_STOP;
  id: string;
};

export type GQLMessageSubscriptionComplete = GQLMessageGeneric & {
  type: MESSAGE_TYPES.GQL_COMPLETE;
  id: string;
};

export type GQLMessageSubscriptionData = GQLMessageGeneric & {
  type: MESSAGE_TYPES.GQL_DATA;
  id: string;
  payload: {
    data: any;
  };
};

export type GQLMessageError = GQLMessageGeneric & {
  type: MESSAGE_TYPES.GQL_ERROR;
  id?: string;
  payload: {
    errors: [];
  };
};

export function isSubscriptionStartMessage(message: any): message is GQLMessageSubscriptionStart {
  if (!message) return false;
  if (message.type !== MESSAGE_TYPES.GQL_START) return false;
  if (!message.id) return false;
  if (!(message.payload && message.payload.data)) return false;
  try {
    const dataJson = JSON.parse(message.payload.data);
    if (!dataJson.query) return false;
  } catch (e) {
    return false;
  }
  if (!(message.payload && message.payload.extensions && message.payload.extensions.authorization)) return false;

  return true;
}

export function isSubscriptionStopMessage(message: any): message is GQLMessageSubscriptionStop {
  if (!message) return false;
  if (message.type !== MESSAGE_TYPES.GQL_STOP) return false;
  if (!message.id) return false;

  return true;
}

export function isSubscriptionConnectionInitMessage(message: any): message is GQLMessageConnectionInit {
  if (!message) return false;
  if (message.type !== MESSAGE_TYPES.GQL_CONNECTION_INIT) return false;
  return true;
}
