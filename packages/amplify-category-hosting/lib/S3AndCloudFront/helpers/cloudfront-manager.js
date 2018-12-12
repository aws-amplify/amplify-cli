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
  let result = context;
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
    result = new Promise((resolve, reject) => {
      cloudFront.createInvalidation(invalidateParams, (err, data) => {
        if (err) {
          context.print.error('Error occured when invalidating the Amazon CloudFront distribution');
          context.print.info(err);
          reject(err);
        } else {
          context.print.info('CloudFront invalidation request sent successfuly.');
          context.print.info(chalk.green(CloudFrontSecureURL));
          context.exeInfo.cftInvalidationData = data;
          resolve(context);
        }
      });
    });
  }
  return result;
}

async function getCloudFrontClient(context, action) {
  const { projectConfig } = context.exeInfo;
  const provider = require(projectConfig.providers[providerName]);
  const aws = await provider.getConfiguredAWSClient(context, constants.CategoryName, action);
  return new aws.CloudFront();
}

module.exports = {
  invalidateCloudFront,
};
