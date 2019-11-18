const Cloudformation = require('../src/aws-utils/aws-cfn');
const { loadConfigurationForEnv } = require('./configuration-manager');

async function run(context, envName, deleteS3) {
  const credentials = await loadConfigurationForEnv(context, envName);
  const cfn = await new Cloudformation(context, null, credentials);
  await cfn.deleteResourceStack(envName, deleteS3);
}

module.exports = {
  run,
};
