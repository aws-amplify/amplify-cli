const inquirer = require('inquirer');
const p8decoder = require('./p8decoder');
const validateFilePath = require('./validateFilepath');

async function run(channelInput) {
  let keyConfig;
  if (channelInput) {
    keyConfig = channelInput;
  } else {
    const questions = [
      {
        name: 'BundleId',
        type: 'input',
        message: 'The bundle id used for APNs Tokens: ',
      },
      {
        name: 'TeamId',
        type: 'input',
        message: 'The team id used for APNs Tokens: ',
      },
      {
        name: 'TokenKeyId',
        type: 'input',
        message: 'The key id used for APNs Tokens: ',
      },
      {
        name: 'P8FilePath',
        type: 'input',
        message: 'The key file path (.p8): ',
        validate: validateFilePath,
      },
    ];
    keyConfig = await inquirer.prompt(questions);
  }

  keyConfig.TokenKey = await p8decoder.run(keyConfig.P8FilePath);
  delete keyConfig.P8FilePath;

  return keyConfig;
}

module.exports = {
  run,
};
