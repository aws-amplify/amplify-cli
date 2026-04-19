import type { Backend } from '../../backend';
import {
  Table,
  AttributeType,
  BillingMode,
  StreamViewType,
  CfnTable,
} from 'aws-cdk-lib/aws-dynamodb';

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
}

export function postRefactor(backend: Backend) {
  const bookmarks = backend.stack.node.findChild('storagebookmarks').node.findChild('bookmarks').node.defaultChild as CfnTable;
  bookmarks.tableName = 'bookmarks-x';
}
