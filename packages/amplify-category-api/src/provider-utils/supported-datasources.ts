export const supportedDatasources = {
  'Aurora Serverless': {
    inputs: [
      {
        key: 'region',
        type: 'list',
        question: 'Provide the region in which your cluster is located:',
        required: true,
      },
      {
        key: 'rdsClusterIdentifier',
        type: 'list',
        question: 'Select the Aurora Serverless cluster that will be used as the data source for your API:',
        required: true,
      },
      {
        key: 'rdsSecretStoreArn',
        type: 'list',
        question: 'Select the secret used to access your Aurora Serverless cluster:',
        required: true,
      },
      {
        key: 'databaseName',
        type: 'list',
        question: 'Select the database to use as the datasource:',
        required: true,
      },
    ],
    alias: 'Aurora Serverless',
    defaultValuesFilename: 'appSync-rds-defaults.js',
    serviceWalkthroughFilename: 'appSync-rds-walkthrough.js',
    cfnFilename: 'appSync-rds-cloudformation-template-default.yml.ejs',
    provider: 'awscloudformation',
    availableRegions: [
      'us-east-1',
      'us-east-2',
      'us-west-1',
      'us-west-2',
      'ap-south-1',
      'ap-southeast-1',
      'ap-southeast-2',
      'ap-northeast-1',
      'eu-central-1',
      'eu-west-1',
      'eu-west-2',
      'eu-west-3',
    ],
  },
};
