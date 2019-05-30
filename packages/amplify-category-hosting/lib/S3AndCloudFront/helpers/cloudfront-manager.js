const chalk = require('chalk');
const constants = require('../../constants');

const providerName = 'awscloudformation';

function invalidateCloudFront(context) {
  if (context.parameters.options.invalidateCache ||
            context.parameters.options.invalidateCloudFront ||
            context.parameters.options.c) {
    return invalidate(context);
  }
}

async function invalidate(context) {
  if (context.exeInfo.serviceMeta &&
    context.exeInfo.serviceMeta.output &&
    context.exeInfo.serviceMeta.output.CloudFrontDistributionID) {
    const { CloudFrontDistributionID } = context.exeInfo.serviceMeta.output;
    const { CloudFrontSecureURL } = context.exeInfo.serviceMeta.output;

    const cloudFront = await getCloudFrontClient(context, 'update');
    const invalidateParams = {
      DistributionId: CloudFrontDistributionID,
      InvalidationBatch: {
        Paths: {
          Quantity: 1,
          Items: ['/*'],
        },
        CallerReference: Date.now().toString(),
      },
    };

    try {
      const data = await cloudFront.createInvalidation(invalidateParams).promise();
      context.print.info('CloudFront invalidation request sent successfuly.');
      context.print.info(chalk.green(CloudFrontSecureURL));
      context.exeInfo.cftInvalidationData = data;
    } catch (err) {
      context.print.error('Error occured when invalidating the Amazon CloudFront distribution');
      context.print.info(err);
      throw err;
    }
  }
  return context;
}

async function getCloudFrontClient(context, action) {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins[providerName]);
  const aws = await provider.getConfiguredAWSClient(context, constants.CategoryName, action);
  return new aws.CloudFront();
}

module.exports = {
  invalidateCloudFront,
};
