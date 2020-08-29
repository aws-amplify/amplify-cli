const path = require('path');
const fs = require('fs-extra');
const { JSONUtilities } = require('amplify-cli-core');

const npm = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';

const reactConfig = {
  SourceDir: 'src',
  DistributionDir: 'build',
  BuildCommand: `${npm} run-script build`,
  StartCommand: `${npm} run-script start`,
};

const reactNativeConfig = {
  SourceDir: '/',
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

function getAngularConfig(projectRoot) {
  const angularConfigFile = path.join(projectRoot, 'angular.json');
  const angularProjectConfig = JSONUtilities.readJson(angularConfigFile, { throwIfNotExist: false });
  let dist = 'dist';
  if (angularProjectConfig && angularProjectConfig.projects && Object.keys(angularProjectConfig.projects).length) {
    const { defaultProject } = angularProjectConfig;
    const projectConfig = angularProjectConfig.projects[defaultProject];
    dist =
      (projectConfig &&
        projectConfig.architect &&
        projectConfig.architect.build &&
        projectConfig.architect.build.options &&
        projectConfig.architect.build.options.outputPath) ||
      'dist';
  }
  return {
    ...angularConfig,
    DistributionDir: dist,
  };
}
export function getProjectConfiguration(framework, projectRoot) {
  switch (framework) {
    case 'angular':
      return getAngularConfig(projectRoot);
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
