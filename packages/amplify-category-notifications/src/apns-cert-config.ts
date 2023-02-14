import { $TSAny } from 'amplify-cli-core';
import { prompter } from 'amplify-prompts';
import { run as p12decoderRun, ICertificateInfo } from './apns-cert-p12decoder';
import { validateFilePath } from './validate-filepath';

/**
 * Run function of Cert Configuration
 */
export const run = async (channelInput: $TSAny): Promise<ICertificateInfo> => {
  if (channelInput) {
    return p12decoderRun(channelInput);
  }

  const p12FilePath = await prompter.input('The certificate file path (.p12): ', { validate: validateFilePath });
  const p12FilePassword = await prompter.input('The certificate password (if any): ');
  const answers = {
    P12FilePath: p12FilePath,
    P12FilePassword: p12FilePassword,
  };

  return p12decoderRun(answers);
};
