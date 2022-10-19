import path from 'path';
import _ from 'lodash';
import {
  $TSAny,
  $TSContext, AngularConfigNotFoundError, exitOnNextTick, JSONUtilities,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

import findUp from 'find-up';

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
  const projectRoot: string = projectPath || context.exeInfo.localEnvInfo.projectPath;
  const parentDirToStop = path.join(...projectRoot.split(path.sep).slice(0, -2));
  const angularConfigFilePath = findUp.sync(directory => (path.basename(directory) === parentDirToStop ? findUp.stop : 'angular.json'), {
    cwd: projectRoot,
  });

  let angularProjectConfig;
  let angularConfigDir;
  let projectRelativePathToConfigDir;
  let relativeSrcPath;
  try {
    angularConfigDir = path.dirname(angularConfigFilePath as string);

    projectRelativePathToConfigDir = path.relative(angularConfigDir, projectRoot);
    relativeSrcPath = path.join(projectRelativePathToConfigDir, 'src');
    angularProjectConfig = JSONUtilities.readJson<$TSAny>(angularConfigFilePath as string);
  } catch (error) {
    const errorMessage = `Failed to read ${angularConfigFilePath}: ${error.message || 'Unknown error occurred.'}`;
    printer.error(errorMessage);
    printer.info(
      `Angular apps need to be set up by the Angular CLI first: https://docs.amplify.aws/start/getting-started/setup/q/integration/angular`,
    );
    context.usageData.emitError(new AngularConfigNotFoundError(errorMessage));
    exitOnNextTick(1);
  }

  const projectName = _.findKey(angularProjectConfig.projects, project => project.sourceRoot === relativeSrcPath);

  const projectExists = _.has(angularProjectConfig, ['projects', projectName as string]);
  if (!projectExists) {
    return angularConfig;
  }

  const dist = _.get(
    angularProjectConfig,
    ['projects', projectName as string, 'architect', 'build', 'options', 'outputPath'],
    'dist',
  );
  const src = _.get(
    angularProjectConfig,
    ['projects', projectName as string, 'sourceRoot'],
    'src',
  );
  return {
    SourceDir: src,
    DistributionDir: dist,
    BuildCommand: `${npm} run-script build ${projectName}`,
    StartCommand: `ng serve ${projectName}`,
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
