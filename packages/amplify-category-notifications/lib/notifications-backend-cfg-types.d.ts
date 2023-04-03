export interface ISMSChannelBackendConfig {
    PromotionalMessagesPerSecond: number;
    TransactionalMessagesPerSecond: number;
}
export interface IEmailChannelBackendConfig {
    FromAddress: string;
    MessagesPerSecond: number;
}
export type INotificationsChannelBackendConfig = IEmailChannelBackendConfig | ISMSChannelBackendConfig;
export interface INotificationsResourceBackendConfigValue {
    service: string;
    channels: Array<string>;
    channelConfig: Record<string, INotificationsChannelBackendConfig>;
}
export interface INotificationsResourceBackendConfig extends INotificationsResourceBackendConfigValue {
    serviceName: string;
}
export type INotificationsServiceBackendConfig = Record<string, INotificationsResourceBackendConfigValue>;
//# sourceMappingURL=notifications-backend-cfg-types.d.ts.map