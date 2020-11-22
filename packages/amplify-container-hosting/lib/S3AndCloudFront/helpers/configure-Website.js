const inquirer = require('inquirer');

const validateDocName = require('./validate-website-doc-name');

async function configure(context) {
  if (!context.exeInfo.template.Resources.CloudFrontDistribution) {
    const { WebsiteConfiguration } = context.exeInfo.template.Resources.S3Bucket.Properties;
    const questions = [
      {
        name: 'IndexDocument',
        type: 'input',
        message: 'index doc for the website',
        default: WebsiteConfiguration.IndexDocument,
        validate: validateDocName,
      },
      {
        name: 'ErrorDocument',
        type: 'input',
        message: 'error doc for the website',
        default: WebsiteConfiguration.ErrorDocument,
        validate: validateDocName,
      },
    ];

    const answers = await inquirer.prompt(questions);
    WebsiteConfiguration.IndexDocument = answers.IndexDocument.trim();
    WebsiteConfiguration.ErrorDocument = answers.ErrorDocument.trim();
  } else {
    context.print.warning('Static webhosting is disabled for the hosting bucket when CloudFront Distribution is enabled.');
  }
  return context;
}

module.exports = {
  configure,
};
