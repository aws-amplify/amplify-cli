const { prompter } = require('@aws-amplify/amplify-prompts');
const validateDocName = require('./validate-website-doc-name');

async function configure(context) {
  if (!context.exeInfo.template.Resources.CloudFrontDistribution) {
    const { WebsiteConfiguration } = context.exeInfo.template.Resources.S3Bucket.Properties;
    WebsiteConfiguration.IndexDocument = await prompter.input('index doc for the website', {
      initial: WebsiteConfiguration.IndexDocument,
      validate: validateDocName,
      transform: (input) => input.trim(),
    });
    WebsiteConfiguration.ErrorDocument = await prompter.input('error doc for the website', {
      initial: WebsiteConfiguration.ErrorDocument,
      validate: validateDocName,
      transform: (input) => input.trim(),
    });
  } else {
    context.print.warning('Static webhosting is disabled for the hosting bucket when CloudFront Distribution is enabled.');
  }
  return context;
}

module.exports = {
  configure,
};
