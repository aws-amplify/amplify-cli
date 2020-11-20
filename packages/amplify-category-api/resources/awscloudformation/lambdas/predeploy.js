const AWS = require('aws-sdk');

const codepipeline = new AWS.CodePipeline();
const ecs = new AWS.ECS();

const { DESIRED_COUNT: desiredCountStr, CLUSTER_NAME: cluster, SERVICE_NAME: service } = process.env;

const desiredCount = parseInt(desiredCountStr, 10);

exports.handler = async function({ 'CodePipeline.job': { id: jobId } }) {
  await ecs
    .updateService({
      service,
      cluster,
      desiredCount,
    })
    .promise();

  return await codepipeline.putJobSuccessResult({ jobId }).promise();
};
