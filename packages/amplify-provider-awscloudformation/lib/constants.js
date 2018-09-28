module.exports = {
  ProviderName: 'awscloudformation',
  Label: 'awscloudformation',
  DefaultAWSAccessKeyId: '<YOUR_ACCESS_KEY_ID>',
  DefaultAWSSecretAccessKey: '<YOUR_SECRET_ACCESS_KEY>',
  DefaultAWSRegion: 'us-east-1',
  KinesisMetricsStreamName: 'aws_amplify_metrics_user_stream',
  KinesisMetricsAmplifyRoleArn: 'arn:aws:iam::827149277658:role/aws-amplify-cli-metrics-putevent-role',
  KinesisMetricsAmplifyRegion: 'us-east-1',
  AWSAmazonConsoleUrl: 'https://console.aws.amazon.com/',
  AWSCreateIAMUsersUrl:
  'https://console.aws.amazon.com/iam/home?region={region}#/users$new?step=final&accessKey&userNames={userName}&permissionType=policies&policies=arn:aws:iam::aws:policy%2FAdministratorAccess',
};
