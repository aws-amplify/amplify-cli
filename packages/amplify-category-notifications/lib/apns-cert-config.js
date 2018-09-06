const inquirer = require('inquirer');
const p12decoder = require('./p12decoder');
const validateFilePath = require('./validateFilepath');

async function run() {
  const questions = [
    {
      name: 'filePath',
      type: 'input',
      message: 'The certificate file path (.p12): ',
      validate: validateFilePath,
    },
    {
      name: 'password',
      type: 'input',
      message: 'The certificate password (if any): ',
    },
  ];

  const answers = await inquirer.prompt(questions);
  const certificateConfig = await p12decoder.run(answers);

  return certificateConfig;
}

module.exports = {
  run,
};
