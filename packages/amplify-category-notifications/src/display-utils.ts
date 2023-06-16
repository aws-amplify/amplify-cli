import { printer } from '@aws-amplify/amplify-prompts';

/**
 * Display warning all channels have been enabled
 */
export const viewShowAllChannelsEnabledWarning = (): void => {
  printer.info('All the available notification channels have already been enabled.');
};
/**
 * Display warning that amplify push is required to enable the channel
 */
export const viewShowDeferredModeInstructions = (): void => {
  printer.warn('Run "amplify push" to update the channel in the cloud');
};

/**
 * Display status that Auth and Pinpoint resources are being deployed to the cloud
 */
export const viewShowInlineModeInstructionsStart = async (channelName: string): Promise<void> => {
  printer.info(`Channel ${channelName} requires a Pinpoint resource in the cloud. Proceeding to deploy Auth and Pinpoint resources...`);
};

/**
 * Display status that Auth and Pinpoint resources have been successfully deployed to the cloud
 */
export const viewShowInlineModeInstructionsStop = async (channelName: string): Promise<void> => {
  printer.success(`Channel ${channelName}: Auth and Pinpoint resources deployed successfully.`);
};

/**
 * Display error message that Auth and Pinpoint resources failed to be deployed to the cloud
 * @param channelName name of the channel to be enabled
 * @param err Error thrown by the pinpoint helper
 */
export const viewShowInlineModeInstructionsFail = async (channelName: string, err: Error | string): Promise<void> => {
  printer.error(`Channel ${channelName}: Auth and Pinpoint resources deployment failed with Error ${err}`);
};
