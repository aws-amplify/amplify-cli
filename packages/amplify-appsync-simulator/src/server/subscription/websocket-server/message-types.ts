export enum MESSAGE_TYPES {
  /**
   * Client -> Server message.
   * This message type is the first message after handshake and this will initialize AWS AppSync RealTime communication
   */
  GQL_CONNECTION_INIT = 'connection_init',
  /**
   * Server -> Client message
   * This message type is in case there is an issue with AWS AppSync RealTime when establishing connection
   */
  GQL_CONNECTION_ERROR = 'connection_error',
  /**
   * Server -> Client message.
   * This message type is for the ack response from AWS AppSync RealTime for GQL_CONNECTION_INIT message
   */
  GQL_CONNECTION_ACK = 'connection_ack',
  /**
   * Client -> Server message.
   * This message type is for register subscriptions with AWS AppSync RealTime
   */
  GQL_START = 'start',
  /**
   * Server -> Client message.
   * This message type is for the ack response from AWS AppSync RealTime for GQL_START message
   */
  GQL_START_ACK = 'start_ack',
  /**
   * Server -> Client message.
   * This message type is for subscription message from AWS AppSync RealTime
   */
  GQL_DATA = 'data',
  /**
   * Server -> Client message.
   * This message type helps the client to know is still receiving messages from AWS AppSync RealTime
   */
  GQL_CONNECTION_KEEP_ALIVE = 'ka',
  /**
   * Client -> Server message.
   * This message type is for unregister subscriptions with AWS AppSync RealTime
   */
  GQL_STOP = 'stop',
  /**
   * Server -> Client message.
   * This message type is for the ack response from AWS AppSync RealTime for GQL_STOP message
   */
  GQL_COMPLETE = 'complete',
  /**
   * Server -> Client message.
   * This message type is for sending error messages from AWS AppSync RealTime to the client
   */
  GQL_ERROR = 'error', // Server -> Client
}
