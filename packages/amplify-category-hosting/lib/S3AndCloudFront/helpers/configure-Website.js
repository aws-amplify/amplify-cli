const inquirer = require('inquirer');

async function configure(context) {
  const { WebsiteConfiguration } = context.exeInfo.template.Resources.S3Bucket.Properties;
  const questions = [
    {
      name: 'IndexDocument',
      type: 'input',
      message: 'index doc for the website',
      default: WebsiteConfiguration.IndexDocument,
    },
    {
      name: 'ErrorDocument',
      type: 'input',
      message: 'error doc for the website',
      default: WebsiteConfiguration.ErrorDocument,
    },
  ];

  const answers = await inquirer.prompt(questions);
  WebsiteConfiguration.IndexDocument = answers.IndexDocument;
  WebsiteConfiguration.ErrorDocument = answers.ErrorDocument;

  return context;
}

module.exports = {
  configure,
};
