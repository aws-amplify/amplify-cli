import { AmplifyError, open } from 'amplify-cli-core';
import chalk from 'chalk';
import inquirer from 'inquirer';
import isOnWsl from 'is-wsl';
import constants from './constants.js';
import * as systemConfigManager from './system-config-manager';
import obfuscationUtil from './utility-obfuscate';

import awsRegions from './aws-regions.js';

/**
 * setup new user entry point
 */
export const run = async (context): Promise<string> => {
  const awsConfigInfo = {
    accessKeyId: constants.DefaultAWSAccessKeyId,
    secretAccessKey: constants.DefaultAWSSecretAccessKey,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: constants.DefaultAWSRegion,
  };

  context.print.info('Follow these steps to set up access to your AWS account:');
  context.print.info('');
  context.print.info('Sign in to your AWS administrator account:');
  context.print.info(chalk.green(constants.AWSAmazonConsoleUrl));
  open(constants.AWSAmazonConsoleUrl, { wait: false }).catch(() => {
    // empty
  });

  await context.amplify.pressEnterToContinue.run({ message: 'Press Enter to continue' });

  context.print.info('Specify the AWS Region');
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'region',
      message: 'region: ',
      choices: awsRegions.regions,
      default: awsConfigInfo.region,
    },
  ]);
  awsConfigInfo.region = answers.region;
  context.print.info('Specify the username of the new IAM user:');
  const { userName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'userName',
      message: 'user name: ',
      default: `amplify-${context.amplify.makeId()}`,
    },
  ]);

  let deepLinkURL = constants.AWSCreateIAMUsersUrl.replace('{userName}', userName).replace('{region}', awsConfigInfo.region);
  const isOnWindows = process.platform === 'win32';
  if (isOnWindows || isOnWsl) {
    deepLinkURL = deepLinkURL.replace('$new', '`$new');
  }
  context.print.info('Complete the user creation using the AWS console');
  context.print.info(chalk.green(deepLinkURL.replace('`', '')));
  open(deepLinkURL, { wait: false }).catch(() => {
    // empty
  });
  await context.amplify.pressEnterToContinue.run({ message: 'Press Enter to continue' });

  context.print.info('Enter the access key of the newly created user:');
  const accountDetails = await inquirer.prompt([
    {
      type: 'password',
      mask: '*',
      name: 'accessKeyId',
      message: 'accessKeyId: ',
      default: awsConfigInfo.accessKeyId,
      transformer: obfuscationUtil.transform,
      validate: input => {
        if (input === constants.DefaultAWSAccessKeyId || input.length < 16 || input.length > 128 || !/^[\w]+$/.test(input)) {
          let message = 'You must enter a valid accessKeyId';
          if (input.length < 16) {
            message += ': Minimum length is 16';
          } else if (input.length > 128) {
            message += ': Maximum length is 128';
          } else if (!/^[\w]+$/.test(input)) {
            message += ': It can only contain letter, number or underscore characters';
          }
          return message;
        }
        return true;
      },
    },
    {
      type: 'password',
      mask: '*',
      name: 'secretAccessKey',
      message: 'secretAccessKey: ',
      default: awsConfigInfo.secretAccessKey,
      transformer: obfuscationUtil.transform,
      validate: input => {
        if (input === constants.DefaultAWSSecretAccessKey || input.trim().length === 0) {
          return 'You must enter a valid secretAccessKey';
        }
        return true;
      },
    },
  ]);

  if (accountDetails.accessKeyId) {
    awsConfigInfo.accessKeyId = accountDetails.accessKeyId.trim();
  }
  if (accountDetails.secretAccessKey) {
    awsConfigInfo.secretAccessKey = accountDetails.secretAccessKey.trim();
  }

  if (validateAWSConfig(awsConfigInfo)) {
    let profileName = 'default';
    context.print.warning('This would update/create the AWS Profile in your local machine');
    const profileDetails = await inquirer.prompt([
      {
        type: 'input',
        name: 'pn',
        message: 'Profile Name: ',
        default: 'default',
      },
    ]);

    profileName = profileDetails.pn.trim();

    systemConfigManager.setProfile(awsConfigInfo, profileName);
    context.print.info('');
    context.print.success('Successfully set up the new user.');
    return profileName;
  }

  throw new AmplifyError('InputValidationError', {
    message: 'Invalid AWS credentials',
    resolution: 'Please check your AWS credentials',
  });
};

const validateAWSConfig = (awsConfigInfo): boolean =>
  awsConfigInfo.accessKeyId !== constants.DefaultAWSAccessKeyId && awsConfigInfo.secretAccessKey !== constants.DefaultAWSSecretAccessKey;
