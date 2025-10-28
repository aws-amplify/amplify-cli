/**
 * AWS CloudFormation resource types that contain stateful data.
 * Deletion of these resources may result in permanent data loss.
 */

export const STATEFUL_RESOURCES = new Set([
  'AWS::Backup::BackupVault',
  'AWS::CloudFormation::Stack',
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
]);
