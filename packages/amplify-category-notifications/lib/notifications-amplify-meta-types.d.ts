import * as backendConfigTypes from './notifications-backend-cfg-types';
export interface ICategoryMeta {
    Id: string;
    Name: string;
    Region: string;
    regulatedResourceName?: string;
    lastPushTimeStamp: string;
}
export type IChannelMeta = Record<string, NotificationsChannelMeta>;
export type IPinpointAppOutput = ICategoryMeta & IChannelMeta;
export type IPinpointAppMeta = ICategoryMeta & IPinpointAppOutput;
export interface INotificationsMeta extends ICategoryMeta {
    ResourceName: string;
    output: Record<string, NotificationsChannelMeta>;
}
interface IChannelResourceMeta {
    ApplicationId: string;
    CreationDate: string;
    Enabled: boolean;
    Id: string;
    LastModifiedDate: string;
    IsArchived: boolean;
    Platform: string;
    Version: number;
}
export interface IEmailChannelResourceMeta extends IChannelResourceMeta, backendConfigTypes.IEmailChannelBackendConfig {
    Identity: string;
    RoleArn: string;
}
interface ISMSChannelResourceMeta extends IChannelResourceMeta, backendConfigTypes.ISMSChannelBackendConfig {
}
type IInAppMsgChannelResourceMeta = IChannelResourceMeta;
export type NotificationsChannelMeta = IEmailChannelResourceMeta | ISMSChannelResourceMeta | IInAppMsgChannelResourceMeta;
export {};
//# sourceMappingURL=notifications-amplify-meta-types.d.ts.map