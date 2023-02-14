import { $TSAny } from 'amplify-cli-core';
import { prompter } from 'amplify-prompts';
import { validateFilePath } from './validate-filepath';
import { run as p8decoderRun } from './apns-cert-p8decoder';
/**
 * APNs Key config run function
 */
export const run = async (channelInput: $TSAny) : Promise<$TSAny> => {
  let keyConfig;

  if (channelInput) {
    keyConfig = channelInput;
  } else {
    const bundleId = await prompter.input('The bundle id used for APNs Tokens: ');
    const teamId = await prompter.input('The team id used for APNs Tokens: ');
    const tokenKeyId = await prompter.input('The key id used for APNs Tokens: ');
    const p8FilePath = await prompter.input('The key file path (.p8): ', { validate: validateFilePath });

    keyConfig = {
      BundleId: bundleId,
      TeamId: teamId,
      TokenKeyId: tokenKeyId,
      P8FilePath: p8FilePath,
    };
  }

  keyConfig.TokenKey = p8decoderRun(keyConfig.P8FilePath);
  delete keyConfig.P8FilePath;

  return keyConfig;
};
