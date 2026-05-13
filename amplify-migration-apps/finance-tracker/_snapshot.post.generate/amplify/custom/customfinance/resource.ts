import { CfnResource } from 'aws-cdk-lib';
import type { Backend } from '../../backend';
import { Customfinance } from './construct';

export const STATEFUL_RESOURCES = [
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
  'AWS::Cognito::IdentityPool',
  'AWS::Cognito::UserPoolClient',
  'AWS::Cognito::IdentityPoolRoleAttachment',
  'AWS::Cognito::UserPoolGroup',
  'AWS::Cognito::UserPoolDomain',
  'AWS::Cognito::UserPoolIdentityProvider',
  'Custom::S3AutoDeleteObjects',
];

export function defineCustomfinance(backend: Backend) {
  const construct = new Customfinance(backend.createStack('customcustomfinance'), 'customfinance');

  for (const cfnResource of construct.node
    .findAll()
    .filter(
      (c) =>
        CfnResource.isCfnResource(c) &&
        STATEFUL_RESOURCES.includes(
          c.cfnResourceType
        )
    )) {
    (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
    (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
  }

  return construct;
}
