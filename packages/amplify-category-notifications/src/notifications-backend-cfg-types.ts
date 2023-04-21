/**
 * SMS Channel data type for Pinpoint notifications in Amplify-Meta
 */
export interface ISMSChannelBackendConfig {
  PromotionalMessagesPerSecond: number;
  // eslint-disable-next-line spellcheck/spell-checker
  TransactionalMessagesPerSecond: number;
}

/**
 *  Email notification backend config data
 */
export interface IEmailChannelBackendConfig {
  FromAddress: string; // Email address bound to the SES (sender endpoint)
  MessagesPerSecond: number; // Throttling for email messages
}

/**
 * Union of all valid notification channel configs
 * Notifications category will save this data in the backend-configs.json
 * note:- This type should not contain any confidential information.
 */
export type INotificationsChannelBackendConfig = IEmailChannelBackendConfig | ISMSChannelBackendConfig;

/**
 * Structure of the Notifications category configuration in backend-config.json
 */
export interface INotificationsResourceBackendConfigValue {
  service: string;
  channels: Array<string>;
  channelConfig: Record<string, INotificationsChannelBackendConfig>;
}

/**
 * Normalized structure of the Notifications category configuration in backend-config.json
 */
export interface INotificationsResourceBackendConfig extends INotificationsResourceBackendConfigValue {
  serviceName: string;
}

/**
 * Structure of the Notifications category configuration in backend-config.json
 */
export type INotificationsServiceBackendConfig = Record<string, INotificationsResourceBackendConfigValue>;
