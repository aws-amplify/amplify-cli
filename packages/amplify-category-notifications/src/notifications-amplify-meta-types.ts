import * as backendConfigTypes from './notifications-backend-cfg-types';

/**
 * Pinpoint app data type.
 * This is the minimum information to be stored in the 'output' section of amplify-meta for the Pinpoint resource
 */
export interface ICategoryMeta {
  Id: string;
  Name: string;
  Region: string;
  regulatedResourceName?: string;
  lastPushTimeStamp: string;
}

/**
 *  Channel specific metadata for notifications metadata (output section of Notifications amplify-meta)
 */
export type IChannelMeta = Record<string, NotificationsChannelMeta>;

/**
 * Output section of notifications resource meta.
 * ICategoryMeta defines the Pinpoint resource
 * Channel Meta stores the channel specific output received from the Pinpoint API response.
 */
export type IPinpointAppOutput = ICategoryMeta & IChannelMeta;

/**
 *  Notifications resource meta data.
 *  { notifications : { Id, Name, Region, regulatedResourceName, output : { channelName : { Enabled : true } } } }
 */
export type IPinpointAppMeta = ICategoryMeta & IPinpointAppOutput;

/**
 * Notifications section of Amplify Meta
 * note:- some fields have been duplicated to support older schemas.
 */
export interface INotificationsMeta extends ICategoryMeta {
  ResourceName: string; // legacy structure to store the resource name (without env)
  output: Record<string, NotificationsChannelMeta>;
}

interface IChannelResourceMeta {
  ApplicationId: string; // Pinpoint Physical ID
  CreationDate: string; // Date-Time
  Enabled: boolean; // Channel is enabled
  Id: string; // Set to email - unused
  LastModifiedDate: string; // Timestamp of when was this channel last updated
  IsArchived: boolean; // SES email state
  Platform: string; // Set to EMAIL/SMS - unused
  Version: number; // Increments when channel is updated
}

/**
 * Email channel data type for Pinpoint notifications in Amplify-Meta
 */
export interface IEmailChannelResourceMeta extends IChannelResourceMeta, backendConfigTypes.IEmailChannelBackendConfig {
  Identity: string; // SES ARN for verified email
  RoleArn: string; // IAM role Auth/UnAuth with access to SMS
}

/**
 * SMS channel data type for Pinpoint notifications in Amplify-Meta
 */
interface ISMSChannelResourceMeta extends IChannelResourceMeta, backendConfigTypes.ISMSChannelBackendConfig {}

/**
 * InAppMessaging channel data type for Pinpoint in-app functionality in Amplify-Meta
 */
type IInAppMsgChannelResourceMeta = IChannelResourceMeta;

/**
 * Union of all valid notification channel meta
 * Notifications category will save this data in the amplify-meta.json
 * note:- This type can contain confidential information as its not saved with code.
 */
export type NotificationsChannelMeta = IEmailChannelResourceMeta | ISMSChannelResourceMeta | IInAppMsgChannelResourceMeta;
