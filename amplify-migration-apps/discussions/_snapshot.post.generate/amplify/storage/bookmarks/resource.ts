import type { Backend } from '../../backend';
import {
  Table,
  AttributeType,
  BillingMode,
  StreamViewType,
  CfnTable,
} from 'aws-cdk-lib/aws-dynamodb';
import { CfnResource } from 'aws-cdk-lib';

export function defineStorageBookmarks(backend: Backend) {
  const storageBookmarksStack = backend.createStack('storagebookmarks');
  const bookmarks = new Table(storageBookmarksStack, 'bookmarks', {
    partitionKey: { name: 'userId', type: AttributeType.STRING },
    billingMode: BillingMode.PROVISIONED,
    readCapacity: 5,
    writeCapacity: 5,
    stream: StreamViewType.NEW_IMAGE,
    sortKey: { name: 'postId', type: AttributeType.STRING },
  });
  bookmarks.addGlobalSecondaryIndex({
    indexName: 'byPost',
    partitionKey: { name: 'postId', type: AttributeType.STRING },
    readCapacity: 5,
    writeCapacity: 5,
  });
  for (const cfnResource of storageBookmarksStack.node
    .findAll()
    .filter(
      (c) =>
        CfnResource.isCfnResource(c) &&
        c.cfnResourceType === 'AWS::DynamoDB::Table'
    )) {
    (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
    (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
  }
  return bookmarks;
}

export function postRefactor(bookmarks: Table) {
  (bookmarks.node.defaultChild as CfnTable).tableName = 'bookmarks-x';
}
