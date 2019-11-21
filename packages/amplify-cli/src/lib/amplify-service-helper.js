const { normalizeInputParams } = require('./input-params-manager');

function constructInputParams(context) {
  const inputParams = normalizeInputParams(context);

  if (inputParams.appId) {
    inputParams.amplify.appId = inputParams.appId;
    delete inputParams.appId;
  }

  if (inputParams.envName) {
    inputParams.amplify.envName = inputParams.envName;
    delete inputParams.envName;
  }

  if (inputParams['no-override'] !== undefined) {
    inputParams.amplify.noOverride = inputParams['no-override'];
    delete inputParams['no-override'];
  }

  return inputParams;
}

async function postPullCodeGenCheck(context) {
  context.print.info('');
}

module.exports = {
  constructInputParams,
  postPullCodeGenCheck,
};
