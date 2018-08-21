const Cloudformation = require('../src/aws-utils/aws-cfn');

async function run(context) {
  return new Cloudformation(context)
    .then(cfnItem => cfnItem.deleteResourceStack());
}

module.exports = {
  run,
};
