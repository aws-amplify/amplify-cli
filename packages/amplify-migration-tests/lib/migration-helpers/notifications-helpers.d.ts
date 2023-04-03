/**
 * Adds notification resource for a given channel
 */
export declare const addLegacySmsNotificationChannel: (cwd: string, resourceName: string, hasAnalytics?: boolean) => Promise<void>;
/**
 * Removes all notifications channels
 */
export declare const removeLegacyAllNotificationChannel: (cwd: string) => Promise<void>;
