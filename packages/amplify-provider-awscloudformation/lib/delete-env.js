const Cloudformation = require('../src/aws-utils/aws-cfn');

async function run(context, envName) {
  const cfn = await new Cloudformation(context, { envName });
  await cfn.deleteResourceStack(envName);
}

module.exports = {
  run,
};
