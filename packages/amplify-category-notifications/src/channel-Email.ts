/* eslint-disable no-param-reassign */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable func-style */

import { $TSAny, $TSContext } from 'amplify-cli-core';

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import inquirer from 'inquirer';
import ora from 'ora';

const channelName = 'Email';
const spinner = ora('');
/**
 * Configure Email channel on analytics resource
 * @param context amplify cli constext
 */
export const configure = async (context: $TSContext):Promise<void> => {
  const isChannelEnabled = context.exeInfo.serviceMeta.output[channelName] && context.exeInfo.serviceMeta.output[channelName].Enabled;

  if (isChannelEnabled) {
    context.print.info(`The ${channelName} channel is currently enabled`);
    const answer = await inquirer.prompt({
      name: 'disableChannel',
      type: 'confirm',
      message: `Do you want to disable the ${channelName} channel`,
      default: false,
    });
    if (answer.disableChannel) {
      await disable(context);
    } else {
      const successMessage = `The ${channelName} channel has been successfully updated.`;
      await enable(context, successMessage);
    }
  } else {
    const answer = await inquirer.prompt({
      name: 'enableChannel',
      type: 'confirm',
      message: `Do you want to enable the ${channelName} channel`,
      default: true,
    });
    if (answer.enableChannel) {
      await enable(context, undefined);
    }
  }
};

/**
 * Enable Email channel on Analytics resource
 * @param context amplify cli context
 * @param successMessage message to be printed on successfully enabling channel
 */
const enable = async (context:$TSContext, successMessage: string|undefined):Promise<$TSAny> => {
  let answers;
  if (context.exeInfo.pinpointInputParams && context.exeInfo.pinpointInputParams[channelName]) {
    answers = validateInputParams(context.exeInfo.pinpointInputParams[channelName]);
  } else {
    let channelOutput:$TSAny = {};
    if (context.exeInfo.serviceMeta.output[channelName]) {
      channelOutput = context.exeInfo.serviceMeta.output[channelName];
    }
    const questions = [
      {
        name: 'FromAddress',
        type: 'input',
        message: "The 'From' Email address used to send emails",
        default: channelOutput.FromAddress,
      },
      {
        name: 'Identity',
        type: 'input',
        message: 'The ARN of an identity verified with SES',
        default: channelOutput.Identity,
      },
      {
        name: 'RoleArn',
        type: 'input',
        message: "The ARN of an IAM Role used to submit events to Mobile notifications' event ingestion service",
        default: channelOutput.RoleArn,
      },
    ];
    answers = await inquirer.prompt(questions);
  }

  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    EmailChannelRequest: {
      ...answers,
      Enabled: true,
    },
  };

  spinner.start('Updating Email Channel.');
  return new Promise((resolve, reject) => {
    context.exeInfo.pinpointClient.updateEmailChannel(params, (err : $TSAny, data: $TSAny) => {
      if (err && err.code === 'NotFoundException') {
        spinner.succeed(`Project with ID '${params.ApplicationId}' was already deleted from the cloud.`);
        resolve({
          id: params.ApplicationId,
        });
      } else if (err) {
        spinner.fail('update channel error');
        reject(err);
      } else {
        if (!successMessage) {
          successMessage = `The ${channelName} channel has been successfully enabled.`;
        }
        spinner.succeed(successMessage);
        context.exeInfo.serviceMeta.output[channelName] = data.EmailChannelResponse;
        resolve(data);
      }
    });
  });
};

const validateInputParams = (channelInput: $TSAny) : $TSAny => {
  if (!channelInput.FromAddress || !channelInput.Identity || !channelInput.RoleArn) {
    throw new Error('Missing FromAddress, Identity or RoleArn for the Email channel');
  }
  return channelInput;
};

/**
 * Disable Email notification channel on Analytics resource
 * @param context - amplify cli context
 * @returns Pinpoint API response
 */
export const disable = async (context:$TSContext) : Promise<$TSAny> => {
  const channelOutput = validateInputParams(context.exeInfo.serviceMeta.output[channelName]);
  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    EmailChannelRequest: {
      Enabled: false,
      FromAddress: channelOutput.FromAddress,
      Identity: channelOutput.Identity,
    },
  };
  spinner.start('Updating Email Channel.');
  return new Promise((resolve, reject) => {
    context.exeInfo.pinpointClient.updateEmailChannel(params, (err:$TSAny, data:$TSAny) => {
      if (err && err.code === 'NotFoundException') {
        spinner.succeed(`Project with ID '${params.ApplicationId}' was already deleted from the cloud.`);
        resolve({
          id: params.ApplicationId,
        });
      } else if (err) {
        spinner.fail('update channel error');
        reject(err);
      } else {
        spinner.succeed(`The ${channelName} channel has been disabled.`);
        context.exeInfo.serviceMeta.output[channelName] = data.EmailChannelResponse;
        resolve(data);
      }
    });
  });
};

/**
 * Pull the Analytics resource and Email channel configuration
 * @param context amplify cli context
 * @param pinpointApp Pinpoint resource meta
 * @returns Pinpoint API response
 */
export const pull = async (context:$TSContext, pinpointApp:$TSAny):Promise<$TSAny> => {
  const params = {
    ApplicationId: pinpointApp.Id,
  };

  spinner.start(`Retrieving channel information for ${channelName}.`);
  return context.exeInfo.pinpointClient
    .getEmailChannel(params)
    .promise()
    .then((data: $TSAny) => {
      spinner.succeed(`Channel information retrieved for ${channelName}`);
      pinpointApp[channelName] = data.EmailChannelResponse;
      return data.EmailChannelResponse;
    })
    .catch((err: $TSAny) => {
      if (err.code === 'NotFoundException') {
        spinner.succeed(`Channel is not setup for ${channelName} `);
        return err;
      }
      spinner.stop();
      throw err;
    });
};

module.exports = {
  configure,
  enable,
  disable,
  pull,
};
