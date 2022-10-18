import path from 'path';
import _ from 'lodash';
import {
  $TSAny,
  $TSContext, AngularConfigNotFoundError, exitOnNextTick, JSONUtilities,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

const npm = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';

type ProjectConfiguration = {
  SourceDir: string,
  DistributionDir: string,
  BuildCommand: string,
  StartCommand: string,
}
const reactConfig: ProjectConfiguration = {
  SourceDir: 'src',
  DistributionDir: 'build',
  BuildCommand: `${npm} run-script build`,
  StartCommand: `${npm} run-script start`,
};

const reactNativeConfig: ProjectConfiguration = {
  SourceDir: 'src',
  DistributionDir: '/',
  BuildCommand: `${npm} run-script build`,
  StartCommand: `${npm} run-script start`,
};

const angularConfig: ProjectConfiguration = {
  SourceDir: 'src',
  DistributionDir: 'dist',
  BuildCommand: `${npm} run-script build`,
  StartCommand: 'ng serve',
};

const ionicConfig: ProjectConfiguration = {
  SourceDir: 'src',
  DistributionDir: 'www',
  BuildCommand: `${npm} run-script build`,
  StartCommand: 'ionic serve',
};

const vueConfig: ProjectConfiguration = {
  SourceDir: 'src',
  DistributionDir: 'dist',
  BuildCommand: `${npm} run-script build`,
  StartCommand: `${npm} run-script serve`,
};

const emberConfig = {
  SourceDir: './',
  DistributionDir: 'dist',
  BuildCommand: `${npm} run-script build -- -e production`,
  StartCommand: `${npm} run-script start`,
};

const defaultConfig: ProjectConfiguration = {
  SourceDir: 'src',
  DistributionDir: 'dist',
  BuildCommand: `${npm} run-script build`,
  StartCommand: `${npm} run-script start`,
};

const getAngularConfig = (context: $TSContext, projectPath?: string): ProjectConfiguration => {
  const projectRoot = projectPath || context.exeInfo.localEnvInfo.projectPath;
  const angularConfigFile = path.join(projectRoot, 'angular.json');
  const projectName
  let angularProjectConfig;
  try {
    angularProjectConfig = JSONUtilities.readJson<$TSAny>(angularConfigFile);
  } catch (error) {
    const errorMessage = `Failed to read ${angularConfigFile}: ${error.message || 'Unknown error occurred.'}`;
    printer.error(errorMessage);
    printer.info(
      `Angular apps need to be set up by the Angular CLI first: https://docs.amplify.aws/start/getting-started/setup/q/integration/angular`,
    );
    context.usageData.emitError(new AngularConfigNotFoundError(errorMessage));
    exitOnNextTick(1);
  }
  const dist = _.get(
    angularProjectConfig,
    ['projects', 'architect', 'build', 'options', 'outputPath'],
    'dist',
  );
  return {
    ...angularConfig,
    DistributionDir: dist,
  };
};

/**
 Returns project configuration for the framework
 */
export const getProjectConfiguration = (context: $TSContext, framework: string, projectPath?: string): ProjectConfiguration => {
  let config;

  switch (framework) {
    case 'angular':
      config = getAngularConfig(context, projectPath);
      break;
    case 'ember':
      config = emberConfig;
      break;
    case 'ionic':
      config = ionicConfig;
      break;
    case 'react':
      config = reactConfig;
      break;
    case 'react-native':
      config = reactNativeConfig;
      break;
    case 'vue':
      config = vueConfig;
      break;
    default:
      config = defaultConfig;
  }

  const headlessConfig = _.get(context, 'exeInfo.inputParams.javascript.config', {});
  config = { ...config, ...headlessConfig };
  return config;
};

/**
 Returns a list containing all the supported frameworks
 */
export const getSupportedFrameworks = (): Array<string> => ['angular', 'ember', 'ionic', 'react', 'react-native', 'vue', 'none'];

export default {
  getSupportedFrameworks,
  getProjectConfiguration,
};
