const open = require('open');
const chalk = require('chalk');
const inquirer = require('inquirer');

const awsRegions = require('./aws-regions.js').regions;
const constants = require('./constants.js');
const systemConfigManager = require('./system-config-manager');
const obfuscationUtil = require('./utility-obfuscate');

function run(context) {
  const awsConfig = {
    accessKeyId: constants.DefaultAWSAccessKeyId,
    secretAccessKey: constants.DefaultAWSSecretAccessKey,
    region: constants.DefaultAWSRegion,
  };

  context.print.info('Follow these steps to set up access to your AWS account:');
  context.print.info('');
  context.print.info('Sign in to your AWS administrator account:');
  context.print.info(chalk.green(constants.AWSAmazonConsoleUrl));
  open(constants.AWSAmazonConsoleUrl, { wait: false }).catch(() => {});

  return context.amplify.pressEnterToContinue.run({ message: 'Press Enter to continue' })
    .then(() => {
      context.print.info('Specify the AWS Region');
      return inquirer.prompt([
        {
          type: 'list',
          name: 'region',
          message: 'region: ',
          choices: awsRegions,
          default: awsConfig.region,
        }]);
    }).then((answers) => {
      awsConfig.region = answers.region;
      context.print.info('Specify the username of the new IAM user:');
      return inquirer.prompt([
        {
          type: 'input',
          name: 'userName',
          message: 'user name: ',
          default: `amplify-${context.amplify.makeId()}`,
        }]);
    }).then((answers) => {
      const deepLinkURL = constants.AWSCreateIAMUsersUrl.replace('{userName}', answers.userName).replace('{region}', answers.region);
      context.print.info('Complete the user creation using the AWS console');
      context.print.info(chalk.green(deepLinkURL));
      open(deepLinkURL, { wait: false }).catch(() => {});
      return context.amplify.pressEnterToContinue.run({ message: 'Press Enter to continue' });
    })
    .then(() => {
      context.print.info('Enter the access key of the newly created user:');
      return inquirer.prompt([
        {
          type: 'input',
          name: 'accessKeyId',
          message: 'accessKeyId: ',
          default: awsConfig.accessKeyId,
          transformer: obfuscationUtil.transform,
        },
        {
          type: 'input',
          name: 'secretAccessKey',
          message: 'secretAccessKey: ',
          default: awsConfig.secretAccessKey,
          transformer: obfuscationUtil.transform,
        },
      ]);
    })
    .then((answers) => {
      if (answers.accessKeyId) {
        awsConfig.accessKeyId = answers.accessKeyId.trim();
      }
      if (answers.secretAccessKey) {
        awsConfig.secretAccessKey = answers.secretAccessKey.trim();
      }
      return awsConfig;
    })
    .then(async (awsConfig) => {
      if (validateAWSConfig(awsConfig)) {
        let profileName = 'default';
        context.print.warning(('This would update/create the AWS Profile in your local machine'));
        const answer = await inquirer.prompt([
          {
            type: 'input',
            name: 'pn',
            message: 'Profile Name: ',
            default: 'default',
          },
        ]);

        profileName = answer.pn.trim();

        systemConfigManager.setProfile(awsConfig, profileName);
        context.print.info('');
        context.print.success('Successfully set up the new user.');
        return profileName;
      }
      context.print.info('');
      context.print.info('You did NOT enter valid keys.');
      throw new Error('New user setup failed.');
    });
}

function validateAWSConfig(awsConfig) {
  return awsConfig.accessKeyId !== constants.DefaultAWSAccessKeyId &&
    awsConfig.secretAccessKey !== constants.DefaultAWSSecretAccessKey;
}


module.exports = {
  run,
};
