/**
 * AWS CloudFormation resource types that contain stateful data.
 * Deletion of these resources may result in permanent data loss.
 */

export const STATEFUL_RESOURCES = new Set([
  'AWS::Backup::BackupVault',
  'AWS::Cognito::UserPool',
  'AWS::DocDB::DBCluster',
  'AWS::DocDB::DBInstance',
  'AWS::DynamoDB::GlobalTable',
  'AWS::DynamoDB::Table',
  'AWS::EC2::Volume',
  'AWS::EFS::FileSystem',
  'AWS::EMR::Cluster',
  'AWS::ElastiCache::CacheCluster',
  'AWS::ElastiCache::ReplicationGroup',
  'AWS::Elasticsearch::Domain',
  'AWS::FSx::FileSystem',
  'AWS::KMS::Key',
  'AWS::Kinesis::Stream',
  'AWS::Logs::LogGroup',
  'AWS::Neptune::DBCluster',
  'AWS::Neptune::DBInstance',
  'AWS::OpenSearchService::Domain',
  'AWS::Organizations::Account',
  'AWS::QLDB::Ledger',
  'AWS::RDS::DBCluster',
  'AWS::RDS::DBInstance',
  'AWS::Redshift::Cluster',
  'AWS::S3::Bucket',
  'AWS::SDB::Domain',
  'AWS::SQS::Queue',
  'AWS::SecretsManager::Secret',
  'AWS::Kinesis::Stream',
  'AWS::Cognito::UserPoolGroup',
  'AWS::Cognito::IdentityPool',
]);

export const AUTH_RESOURCES_TO_RETAIN = [
  'AWS::Cognito::UserPool',
  'AWS::Cognito::IdentityPool',
  'AWS::Cognito::UserPoolClient',
  'AWS::Cognito::IdentityPoolRoleAttachment',
  'AWS::Cognito::UserPoolGroup',
];

/**
 * Cognito IDP and domain resources that must carry DeletionPolicy: Retain in the
 * Gen2 CDK output. The refactor step orphans these from Gen2 and re-imports the
 * Gen1 physical resources under the same logical IDs. Without Retain on the Gen2
 * resource, the orphan step would physically delete the Cognito domain / IDP.
 *
 * Kept separate from AUTH_RESOURCES_TO_RETAIN because that list also drives the
 * deletion-policy validation in the refactor command (which does not require
 * Retain on the domain / IDPs — the refactor's orphan operation has its own
 * execute-time guard).
 */
export const AUTH_IMPORT_RESOURCES_TO_RETAIN = ['AWS::Cognito::UserPoolDomain', 'AWS::Cognito::UserPoolIdentityProvider'];

/**
 * Logical IDs of the Gen1 HostedUI Lambda-backed custom resources. These
 * manage the UserPoolDomain and UserPoolIdentityProvider physical resources,
 * and their Delete handlers would destroy those physical resources when the
 * Gen1 auth stack is decommissioned after a successful refactor. Lock sets
 * Retain on them so decommissioning is non-destructive.
 *
 * Matched by logical ID rather than resource type (Custom::LambdaCallout)
 * because Gen1 uses Custom::LambdaCallout for other purposes too — only these
 * two logical IDs are the HostedUI managers that must survive Gen1 teardown.
 */
export const AUTH_HOSTED_UI_RESOURCES_TO_RETAIN = ['HostedUICustomResourceInputs', 'HostedUIProvidersCustomResourceInputs'];

export const STORAGE_S3_RESOURCES_TO_RETAIN = [
  'AWS::S3::Bucket',

  // CDK custom resource that only exists in the Gen2 stack. we need to explicitly retain
  // this because after refactor, the bucket name this resource Refs to changes
  // and CloudFormation triggers a Delete event - which will cause the data in the Gen2 (not the Gen1)
  // bucket to be deleted. since we retain the bucket, lets make sure the data is retained as well.
  // see https://github.com/aws/aws-cdk/blob/c983471c1b3576b6daa8a0809573c2d165aca870/packages/%40aws-cdk/custom-resource-handlers/lib/aws-s3/auto-delete-objects-handler/index.ts#L29-L35
  'Custom::S3AutoDeleteObjects',
];
export const STORAGE_DYNAMO_RESOURCES_TO_RETAIN = ['AWS::DynamoDB::Table'];

export const ANALYTICS_RESOURCES_TO_RETAIN = ['AWS::Kinesis::Stream'];

export const RESOURCES_TO_RETAIN = [
  ...AUTH_RESOURCES_TO_RETAIN,
  ...AUTH_IMPORT_RESOURCES_TO_RETAIN,
  ...STORAGE_S3_RESOURCES_TO_RETAIN,
  ...STORAGE_DYNAMO_RESOURCES_TO_RETAIN,
  ...ANALYTICS_RESOURCES_TO_RETAIN,
];
