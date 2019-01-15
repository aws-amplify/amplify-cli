const inquirer = require('inquirer');

async function configure(context) {
  const { WebsiteConfiguration } = context.exeInfo.template.Resources.S3Bucket.Properties;
  const questions = [
    {
      name: 'IndexDocument',
      type: 'input',
      message: 'index doc for the website',
      default: WebsiteConfiguration.IndexDocument,
      validate: docKeyValidation,
    },
    {
      name: 'ErrorDocument',
      type: 'input',
      message: 'error doc for the website',
      default: WebsiteConfiguration.ErrorDocument,
      validate: docKeyValidation,
    },
  ];

  const answers = await inquirer.prompt(questions);
  WebsiteConfiguration.IndexDocument = answers.IndexDocument.trim();
  WebsiteConfiguration.ErrorDocument = answers.ErrorDocument.trim();

  return context;
}

function docKeyValidation(str) {
  str = str.trim();

  let isValid = str.length > 0;
  if (!isValid) {
    return 'Must not be empty, or only contains space characters.';
  }

  isValid = !/\//.test(str);
  if (!isValid) {
    return 'The slash charactor is not allowed.';
  }
  return true;
}

module.exports = {
  configure,
};
