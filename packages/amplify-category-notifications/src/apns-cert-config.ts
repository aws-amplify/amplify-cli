import { $TSAny } from 'amplify-cli-core';
import * as inquirer from 'inquirer';
import { ICertificateInfo, run as p12DecoderRun } from './apns-cert-p12decoder';
import * as validateFilePath from './validateFilepath';

/**
 * Run function of Cert Configuration
 */
export const run = async (channelInput: $TSAny): Promise<ICertificateInfo> => {
  let certificateConfig: ICertificateInfo;
  if (channelInput) {
    certificateConfig = p12DecoderRun(channelInput);
  } else {
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
    certificateConfig = p12DecoderRun(answers);
  }

  return certificateConfig;
};

module.exports = {
  run,
};
