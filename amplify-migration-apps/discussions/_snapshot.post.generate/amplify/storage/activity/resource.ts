import type { Backend } from '../../backend';
import {
  Table,
  AttributeType,
  BillingMode,
  StreamViewType,
  CfnTable,
} from 'aws-cdk-lib/aws-dynamodb';
import { CfnResource } from 'aws-cdk-lib';

export function defineStorageActivity(backend: Backend) {
  const storageActivityStack = backend.createStack('storageactivity');
  const activity = new Table(storageActivityStack, 'activity', {
    partitionKey: { name: 'id', type: AttributeType.STRING },
    billingMode: BillingMode.PROVISIONED,
    readCapacity: 5,
    writeCapacity: 5,
    stream: StreamViewType.NEW_IMAGE,
    sortKey: { name: 'userId', type: AttributeType.STRING },
  });
  activity.addGlobalSecondaryIndex({
    indexName: 'byUserId',
    partitionKey: { name: 'userId', type: AttributeType.STRING },
    sortKey: { name: 'timestamp', type: AttributeType.STRING },
    readCapacity: 5,
    writeCapacity: 5,
  });
  for (const cfnResource of storageActivityStack.node
    .findAll()
    .filter(
      (c) =>
        CfnResource.isCfnResource(c) &&
        c.cfnResourceType === 'AWS::DynamoDB::Table'
    )) {
    (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
    (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
  }
  return activity;
}

export function postRefactor(activity: Table) {
  (activity.node.defaultChild as CfnTable).tableName = 'activity-x';
}
