/**
 * Utility functions to generate PinpointAppName and extract PinpointResourceName
 */
export class PinpointName {
  /**
 * Removes envTagPattern from PinpointAppName.
 * @param pinpointAppName is the Pinpoint app name of the form 'resourceName + envTagPattern' in amplify-meta.json
 * @param envName amplify env in which application is deployed
 * @returns 'resourceName' Removes envTagPattern from PinpointAppName
 */
 public static extractResourceName = (pinpointAppName: string, envName: string):string => pinpointAppName.replace(PinpointName.getEnvTagPattern(envName), '');

 /**
 * PinpointAppName = ResourceName+EnvTag for use in amplify-meta.json
 * @param resourceName is the Pinpoint resource name in backend-config.json
 * @param envName amplify env in which application is deployed
 * @returns 'resourceName+envTag' : Appends envTagPattern to ResourceName
 */
 public static generatePinpointAppName = (resourceName : string, envName: string):string => {
   const pinpointAppName = resourceName + PinpointName.getEnvTagPattern(envName);
   return pinpointAppName;
 }

 protected static getEnvTagPattern = (envName: string) : string => (envName === 'NONE' ? '' : `-${envName}`);
}
