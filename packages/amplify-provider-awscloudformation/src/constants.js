module.exports = {
  ProviderName: 'awscloudformation',
  Label: 'awscloudformation',
  AmplifyAppIdLabel: 'AmplifyAppId',
  CacheFileName: 'cache.json',
  S3BackendZipFileName: '#current-cloud-backend.zip',
  LocalAWSInfoFileName: 'local-aws-info.json',
  Aliases: ['aws', 'cloudformation', 'cfn', 'awscfn'],
  DefaultAWSAccessKeyId: '<YOUR_ACCESS_KEY_ID>',
  DefaultAWSSecretAccessKey: '<YOUR_SECRET_ACCESS_KEY>',
  DefaultAWSRegion: 'us-east-1',
  AWSAmazonConsoleUrl: 'https://console.aws.amazon.com/',
  AWSCreateIAMUsersUrl: 'https://console.aws.amazon.com/iamv2/home#/users/create',
  CreateIAMUserAmplifyDocs: 'https://docs.amplify.aws/cli/start/install/#configure-the-amplify-cli',
  FunctionCategoryName: 'function',
  // keep in sync with ServiceName in amplify-category-function, but probably it will not change
  FunctionServiceNameLambdaLayer: 'LambdaLayer',
  destructiveUpdatesFlag: 'allow-destructive-graphql-schema-updates',
};
