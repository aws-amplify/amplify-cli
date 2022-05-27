import * as backendConfigTypes from './notifications-backend-config-types';

/**
 * Pinpoint app data type.
 * This is the minimum information to be stored in the 'output' section of amplify-meta for the Pinpoint resource
 */
export interface ICategoryMeta {
  Id: string,
  Name: string,
  Region: string,
  regulatedResourceName? : string
}

interface IChannelResourceMeta {
    ApplicationId: string, // Pinpoint Physical ID
    CreationDate: string, // Date-Time
    Enabled : boolean, // Channel is enabled
    Id: string, // Set to email - unused
    LastModifiedDate : string, // Timestamp of when was this channel last updated
    IsArchived: boolean, // SES email state
    Platform : string, // Set to EMAIL/SMS - unused
    Version : number, // Increments when channel is updated
  }

/**
   * Email channel data type for Pinpoint notifications in Amplify-Meta
   */
export interface IEmailChannelResourceMeta extends IChannelResourceMeta, backendConfigTypes.IEmailChannelBackendConfig{
    Identity: string, // SES ARN for verified email
    RoleArn : string, // IAM role Auth/UnAuth with access to SMS
  }

  /**
   * SMS channel data type for Pinpoint notifications in Amplify-Meta
   */
  interface ISMSChannelResourceMeta extends IChannelResourceMeta, backendConfigTypes.ISMSChannelBackendConfig {
  }
  /**
   * InAppMessaging channel data type for Pinpoint in-app functionality in Amplify-Meta
   */
   type IInAppMsgChannelResourceMeta = IChannelResourceMeta

/**
   * Union of all valid notification channel meta
   * Notifications category will save this data in the amplify-meta.json
   * note:- This type can contain confidential information as its not saved with code.
   */
export type NotificationsChannelMeta = IEmailChannelResourceMeta | ISMSChannelResourceMeta | IInAppMsgChannelResourceMeta;
