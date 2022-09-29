import { $TSAny } from 'amplify-cli-core';
import inquirer from 'inquirer';
import { run as p12decoderRun, ICertificateInfo } from './apns-cert-p12decoder';
import { validateFilePath } from './validate-filepath';

/**
 * Run function of Cert Configuration
 */
export const run = async (channelInput: $TSAny): Promise<ICertificateInfo> => {
  if (channelInput) {
    return p12decoderRun(channelInput);
  }

  const questions = [
    {
      name: 'P12FilePath',
      type: 'input',
      message: 'The certificate file path (.p12): ',
      validate: validateFilePath,
    },
    {
      name: 'P12FilePassword',
      type: 'input',
      message: 'The certificate password (if any): ',
    },
  ];

  const answers = await inquirer.prompt(questions);
  return p12decoderRun(answers);
};
