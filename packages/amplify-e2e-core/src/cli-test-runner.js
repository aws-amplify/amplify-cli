const circusRunner = require('jest-circus/runner');
const throat = require('throat');
const uuid = require('uuid');

const mutex = throat(1);
export const run = async (globalConfig, config, environment, runtime, testPath) => {
  const CLITestRunner = {};
  environment.global.addCLITestRunnerLogs = logs => {
    CLITestRunner.logs = logs;
  };

  environment.global.getRandomId = () => mutex(() => uuid.v4().split('-')[0]);
  const result = await circusRunner(globalConfig, config, environment, runtime, testPath);
  result.CLITestRunner = CLITestRunner;
  return result;
};

module.exports = run;
