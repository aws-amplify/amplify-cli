/**
 * notifications settings
 */
type NotificationSettings = {
    resourceName: string;
};
/**
 * removes all the notification channel
 */
export declare const removeAllNotificationChannel: (cwd: string) => Promise<void>;
/**
 * removes the notification channel
 */
export declare const removeNotificationChannel: (cwd: string, channel: string) => Promise<void>;
/**
 * Adds notification resource for a given channel
 *
 * @param cwd the current working directory to run CLI in
 * @param settings settings required to add a notification channel
 * @param settings.resourceName the name to give to the created pinpoint resource
 * @param channel the channel to add
 */
export declare const addNotificationChannel: (cwd: string, { resourceName }: NotificationSettings, channel: string, hasAnalytics?: boolean, hasAuth?: boolean, testingWithLatestCodebase?: boolean) => Promise<void>;
export {};
