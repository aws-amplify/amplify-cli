const Cloudformation = require('../src/aws-utils/aws-cfn');
const { loadConfigurationForEnv } = require('./configuration-manager');
const { deleteEnv } = require('./amplify-service-manager');

async function run(context, envName, deleteS3) {
  const awsConfig = await loadConfigurationForEnv(context, envName);
  const cfn = await new Cloudformation(context, null, awsConfig);
  await cfn.deleteResourceStack(envName, deleteS3);
  await deleteEnv(context, envName, awsConfig);
}

module.exports = {
  run,
};
