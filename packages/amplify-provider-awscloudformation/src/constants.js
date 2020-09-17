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
  AWSCreateIAMUsersUrl:
    'https://console.aws.amazon.com/iam/home?region={region}#/users$new?step=final&accessKey&userNames={userName}&permissionType=policies&policies=arn:aws:iam::aws:policy%2FAdministratorAccess',
};
