const awsClient = require('../src/aws-utils/aws');
const constants = require('./constants');
const moment = require('moment');
const crypto = require('crypto');
const fs = require('fs');

const kinesisStreamName = 'aws_amplify_metrics_user_stream';
const kinesisAmplifyRoleArn = 'arn:aws:iam::827149277658:role/aws-amplify-cli-metrics-putevent-role';
const kinesisAmplifyRegion = 'us-east-1';

async function emitMetric(context, event) {
  try {
    // Check for metric setting. If answered No -> return and don't send metrics
    const projectConfigFilePath = context.amplify.pathManager.getProjectConfigFilePath();
    const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));

    if (!projectConfig.sendAmplifyMetrics) {
      return;
    }


    const configuredAWSClient = await awsClient.configureWithCreds(context);
    const sts = new configuredAWSClient.STS({ apiVersion: '2012-08-10' });
    const stackId = context.exeInfo ?
      context.exeInfo.rcData.providers[constants.ProviderName].StackId :
      context.amplify.getProjectDetails().amplifyMeta.providers[constants.ProviderName].StackId;
    const accountId = stackId.split(':')[4];
    const stackIdGuid = stackId.split('/')[2];

    const hashedAccountId = crypto.createHash('md5').update(accountId).digest('hex');
    const timestamp = String(moment().unix());


    event.stackId = stackIdGuid;
    event.accountId = hashedAccountId;
    event.timestamp = timestamp;
    event.month = moment().month();
    event.year = moment().year();
    event.date = moment().date();

    if (!event.service) {
      event.service = 'NA';
    }

    const amplifyRoleParams = {
      RoleArn: kinesisAmplifyRoleArn,
      RoleSessionName: timestamp,
    };

    return sts.assumeRole(amplifyRoleParams).promise()
      .then((data) => {
        configuredAWSClient.config.update({
          accessKeyId: data.Credentials.AccessKeyId,
          secretAccessKey: data.Credentials.SecretAccessKey,
          sessionToken: data.Credentials.SessionToken,
          region: kinesisAmplifyRegion,
        });

        const kinesis = new configuredAWSClient.Kinesis({ apiVersion: '2013-12-02' });

        const kinesisParams = {
          Data: JSON.stringify(event),
          PartitionKey: timestamp,
          StreamName: kinesisStreamName,
        };

        return kinesis.putRecord(kinesisParams).promise();
      });
  } catch (e) {
    context.print.error('Failed to send metrics to Amplify');
    context.print.error(e);
  }
}


module.exports = {
  emitMetric,
};
