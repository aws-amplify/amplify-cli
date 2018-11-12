const inquirer = require('inquirer');
const p12decoder = require('./p12decoder');
const validateFilePath = require('./validateFilepath');

async function run(channelInput) {
  let certificateConfig;
  if (channelInput) {
    certificateConfig = await p12decoder.run(channelInput);
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
    certificateConfig = await p12decoder.run(answers);
  }

  return certificateConfig;
}

module.exports = {
  run,
};
