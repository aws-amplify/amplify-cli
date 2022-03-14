const circusRunner = require('jest-circus/runner');
const throat = require('throat');
const { v4: uuid } = require('uuid');

const mutex = throat(1);
export const run = async (globalConfig, config, environment, runtime, testPath) => {
  const CLITestRunner = {};
  environment.global.addCLITestRunnerLogs = logs => {
    CLITestRunner.logs = logs;
  };

  environment.global.getRandomId = () => mutex(() => uuid().split('-')[0]);
  const result = await circusRunner(globalConfig, config, environment, runtime, testPath);
  setTimeout(() => {
    if (process.platform === 'win32') {
      // An issue with node-pty leaves open handles when running within jest
      // This prevents the jest process from exiting without being forced.
      // Exiting here as a workaround, only on windows.
      // A timeout is used to give Jest time to render the list of passed/failed tests.
      // See https://github.com/microsoft/node-pty/issues/437
      process.exit(result.numFailingTests !== 0);
    }
  }, 1000);
  result.CLITestRunner = CLITestRunner;
  return result;
};

module.exports = run;
