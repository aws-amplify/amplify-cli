const inquirer = require('inquirer');

async function configure(context) {
  const { DistributionConfig } =
    context.exeInfo.template.Resources.CloudFrontDistribution.Properties;

  const questions = [
    {
      name: 'DefaultRootObject',
      type: 'input',
      message: 'default object to return from origin',
      default: DistributionConfig.DefaultRootObject,
    },
    {
      name: 'DefaultCacheDefaultTTL',
      type: 'input',
      message: 'Default TTL for the default cache behavior',
      default: DistributionConfig.DefaultCacheBehavior.DefaultTTL,
    },
    {
      name: 'DefaultCacheMaxTTL',
      type: 'input',
      message: 'Max TTL for the default cache behavior',
      default: DistributionConfig.DefaultCacheBehavior.MaxTTL,
    },
    {
      name: 'DefaultCacheMinTTL',
      type: 'input',
      message: 'Min TTL for the default cache behavior',
      default: DistributionConfig.DefaultCacheBehavior.MinTTL,
    },
  ];

  const answers = await inquirer.prompt(questions);
  DistributionConfig.DefaultRootObject = answers.DefaultRootObject;
  DistributionConfig.DefaultCacheBehavior.DefaultTTL = answers.DefaultCacheDefaultTTL;
  DistributionConfig.DefaultCacheBehavior.MaxTTL = answers.DefaultCacheMaxTTL;
  DistributionConfig.DefaultCacheBehavior.MinTTL = answers.DefaultCacheMinTTL;

  return context;
}

module.exports = {
  configure,
};
