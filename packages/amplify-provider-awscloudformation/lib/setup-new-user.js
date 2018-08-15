const opn = require('opn');
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

  context.print.info('Please follow these steps to setup your aws access');
  context.print.info('');
  context.print.info('Please sign up/in your aws account with Administrator Access:');
  context.print.info(chalk.green(constants.AWSAmazonConsoleUrl));
  opn(constants.AWSAmazonConsoleUrl, { wait: false });

  return context.amplify.pressEnterToContinue.run({ message: 'Press Enter to continue' })
    .then(() => {
      context.print.info('Please specify the aws region');
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
      context.print.info('Please specify the username of the new IAM user');
      return inquirer.prompt([
        {
          type: 'input',
          name: 'userName',
          message: 'user name: ',
          default: `amplify-${context.amplify.makeId()}`,
        }]);
    }).then((answers) => {
      const deepLinkURL = constants.AWSCreateIAMUsersUrl.replace('{userName}', answers.userName).replace('{region}', answers.region);
      context.print.info('Please complete the user creation on the aws console');
      context.print.info(chalk.green(deepLinkURL));
      opn(deepLinkURL, { wait: false });
      return context.amplify.pressEnterToContinue.run({ message: 'Press Enter to continue' });
    })
    .then(() => {
      context.print.info('Please enter the access key of the newly created user:');
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

        let answer = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'assignProfileName',
            message: 'Assign a profile name for this user: ',
            default: false,
          },
        ]);

        if (answer.assignProfileName) {
          answer = await inquirer.prompt([
            {
              type: 'input',
              name: 'pn',
              message: 'Profile Name: ',
              default: 'default',
            },
          ]);
          if (answer && answer.pn) {
            profileName = answer.pn;
          }
        }

        systemConfigManager.setProfile(awsConfig, profileName);
        context.newUserInfo = {
          profileName,
        };
        context.print.info('');
        context.print.info('Successfully setup the new user.');
        return context;
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
