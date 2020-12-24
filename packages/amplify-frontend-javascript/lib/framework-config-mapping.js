const path = require('path');
const _ = require('lodash');
const { AngularConfigNotFoundError, exitOnNextTick, JSONUtilities } = require('amplify-cli-core');

const npm = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';

const reactConfig = {
  SourceDir: 'src',
  DistributionDir: 'build',
  BuildCommand: `${npm} run-script build`,
  StartCommand: `${npm} run-script start`,
};

const reactNativeConfig = {
  SourceDir: 'src',
  DistributionDir: '/',
  BuildCommand: `${npm} run-script build`,
  StartCommand: `${npm} run-script start`,
};

const angularConfig = {
  SourceDir: 'src',
  DistributionDir: 'dist',
  BuildCommand: `${npm} run-script build`,
  StartCommand: 'ng serve',
};

const ionicConfig = {
  SourceDir: 'src',
  DistributionDir: 'www',
  BuildCommand: `${npm} run-script build`,
  StartCommand: 'ionic serve',
};

const vueConfig = {
  SourceDir: 'src',
  DistributionDir: 'dist',
  BuildCommand: `${npm} run-script build`,
  StartCommand: `${npm} run-script serve`,
};

const emberConfig = {
  SourceDir: '/',
  DistributionDir: 'dist',
  BuildCommand: `${npm} run-script build -- -e production`,
  StartCommand: `${npm} run-script start`,
};

const defaultConfig = {
  SourceDir: 'src',
  DistributionDir: 'dist',
  BuildCommand: `${npm} run-script build`,
  StartCommand: `${npm} run-script start`,
};

function getAngularConfig(context) {
  const projectRoot = context.exeInfo.localEnvInfo.projectPath;
  const angularConfigFile = path.join(projectRoot, 'angular.json');
  let angularProjectConfig;
  try {
    angularProjectConfig = JSONUtilities.readJson(angularConfigFile);
  } catch (error) {
    const errorMessage = `Failed to read ${angularConfigFile}: ${error.message || 'Unknown error occurred.'}`;
    context.print.error(errorMessage);
    context.print.info(
      `Angular apps need to be set up by the Angular CLI first: https://docs.amplify.aws/start/getting-started/setup/q/integration/angular`,
    );
    context.usageData.emitError(new AngularConfigNotFoundError(errorMessage));
    exitOnNextTick(1);
  }
  const dist = _.get(
    angularProjectConfig,
    ['projects', angularProjectConfig.defaultProject, 'architect', 'build', 'options', 'outputPath'],
    'dist',
  );
  return {
    ...angularConfig,
    DistributionDir: dist,
  };
}

function getProjectConfiguration(context, framework) {
  switch (framework) {
    case 'angular':
      return getAngularConfig(context);
    case 'ember':
      return emberConfig;
    case 'ionic':
      return ionicConfig;
    case 'react':
      return reactConfig;
    case 'react-native':
      return reactNativeConfig;
    case 'vue':
      return vueConfig;
    default:
      return defaultConfig;
  }
}

function getSupportedFrameworks() {
  return ['angular', 'ember', 'ionic', 'react', 'react-native', 'vue', 'none'];
}

module.exports = {
  getSupportedFrameworks,
  getProjectConfiguration,
};
