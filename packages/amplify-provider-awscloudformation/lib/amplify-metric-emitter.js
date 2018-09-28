const awsClient = require('../src/aws-utils/aws');
const constants = require('./constants');
const moment = require('moment');
const crypto = require('crypto');
const fs = require('fs');

const kinesisStreamName = require('./constants').KinesisMetricsStreamName;
const kinesisAmplifyRoleArn = require('./constants').KinesisMetricsAmplifyRoleArn;
const kinesisAmplifyRegion = require('./constants').KinesisMetricsAmplifyRegion;

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


    event.stack = stackIdGuid;
    event.id = hashedAccountId;
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
  }
}


module.exports = {
  emitMetric,
};
