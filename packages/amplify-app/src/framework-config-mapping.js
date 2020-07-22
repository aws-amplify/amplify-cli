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

module.exports = {
  angular: angularConfig,
  ember: emberConfig,
  ionic: ionicConfig,
  react: reactConfig,
  'react-native': reactNativeConfig,
  vue: vueConfig,
  none: defaultConfig,
};
