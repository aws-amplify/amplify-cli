const Cloudformation = require('../src/aws-utils/aws-cfn');


async function run(context, envName) {
  return new Cloudformation(context)
    .then(cfnItem => cfnItem.deleteResourceStack(envName));
}

module.exports = {
  run,
};
