module.exports = {
  Label: 'ios',
  ProjectScanBaseScore: 0,
  ProjectScanMaxScore: 100,
  awsConfigFilename: 'awsconfiguration.json',
  amplifyConfigFilename: 'amplifyconfiguration.json',
  FILE_EXTENSION_MAP: {
    javascript: 'js',
    graphql: 'graphql',
    flow: 'js',
    typescript: 'ts',
    angular: 'graphql',
    swift: 'graphql',
  },
  fileNames: ['queries', 'mutations', 'subscriptions'],
};
