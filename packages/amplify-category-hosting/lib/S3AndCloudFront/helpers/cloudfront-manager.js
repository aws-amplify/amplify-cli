const chalk = require('chalk');
const constants = require('../../constants');
const CloudFront = require('aws-sdk/clients/cloudfront');

const providerName = 'awscloudformation';

function invalidateCloudFront(context, cloudFrontClient = getCloudFrontClient) {
  if (context.parameters.options.invalidateCache || context.parameters.options.invalidateCloudFront || context.parameters.options.c) {
    return invalidate(context, cloudFrontClient);
  }
}

async function invalidate(context, cloudFrontClient = getCloudFrontClient) {
  if (context.exeInfo.serviceMeta && context.exeInfo.serviceMeta.output && context.exeInfo.serviceMeta.output.CloudFrontDistributionID) {
    const { CloudFrontDistributionID } = context.exeInfo.serviceMeta.output;
    const { CloudFrontSecureURL } = context.exeInfo.serviceMeta.output;

    const cloudFront = await cloudFrontClient(context, 'update');
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
      context.print.error('Error occurred when invalidating the Amazon CloudFront distribution');
      context.print.info(err);
      throw err;
    }
  }
  return context;
}

async function getCloudFrontClient(context, action) {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins[providerName]);
  const config = await provider.getConfiguredAWSClient(context, constants.CategoryName, action);
  return new CloudFront(config);
}

module.exports = {
  invalidateCloudFront,
};
