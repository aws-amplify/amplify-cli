const Cloudformation = require('../src/aws-utils/aws-cfn');
const { loadConfigurationForEnv } = require('./configuration-manager');

async function run(context, envName) {
  const credentials = await loadConfigurationForEnv(context, envName);
  const cfn = await new Cloudformation(context, null, credentials);
  await cfn.deleteResourceStack(envName);
}

module.exports = {
  run,
};
