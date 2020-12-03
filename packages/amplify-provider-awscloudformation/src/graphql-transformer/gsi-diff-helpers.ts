import { DynamoDB, IntrinsicFunction } from 'cloudform';
import * as _ from 'lodash';
import { GlobalSecondaryIndex } from 'cloudform-types/types/dynamoDb/table';
import Table from 'cloudform-types/types/glue/table';
import { diff as getDiffs } from 'deep-diff';

export enum GSIChange {
  Add = 'ADD',
  Update = 'UPDATE',
  Delete = 'DELETE',
}

export type IndexChange = {
  type: GSIChange;
  indexName: string;
};

/**
 * Generate a list of GSI changes that needs to be pushed to update the
 * GSIs
 * @param current DynamoDB table represnting currently deployed
 * @param next DynamoDB table configuration that needs to be deployed
 */
export const getGSIDiffs = (current: DynamoDB.Table, next: DynamoDB.Table): IndexChange[] => {
  if (
    current.Properties.GlobalSecondaryIndexes instanceof IntrinsicFunction ||
    next.Properties.GlobalSecondaryIndexes instanceof IntrinsicFunction
  ) {
    return [];
  }

  const currentIndexes = current.Properties.GlobalSecondaryIndexes ?? [];
  const nextIndexes = next.Properties.GlobalSecondaryIndexes ?? [];

  return generateGSIChangeList(currentIndexes, nextIndexes);
};

/**
 * Generates a list of operation that needs to be performed in iterative push to update
 * the DynamoDB tables GSIs
 * @param currentIndexes DynamoDB GlobalSecondaryIndexes represnting currently deployed table
 * @param nextIndexes DynamoDB GlobalSecondaryIndexes that needs to be deployed in next push
 */
export const generateGSIChangeList = (currentIndexes: GlobalSecondaryIndex[], nextIndexes: GlobalSecondaryIndex[]): IndexChange[] => {
  // Create  Record<IndexName, Index>
  const currentIndexByIndexName = _.keyBy(currentIndexes, 'IndexName');
  // create an array of indexes
  const currentIndexNames = Object.keys(currentIndexByIndexName);

  // Create  Record<IndexName, Index>
  const nextIndexByIndexName = _.keyBy(nextIndexes, 'IndexName');
  // create an array of indexes
  const nextIndexNames = Object.keys(nextIndexByIndexName);

  // Get the indexes which are not in both current and next indexes
  const addedOrRemovedIndexNames = _.xor(currentIndexNames, nextIndexNames);

  // Partition them as added/removed indexes
  const [indexToRemove, indexToAdd] = _.partition(addedOrRemovedIndexNames, indexName => currentIndexNames.includes(indexName));

  // Get all the indexes that are in bot current and next indexes
  const possiblyModifiedIndexNames = _.xor([...currentIndexNames, ...nextIndexNames], addedOrRemovedIndexNames);

  const modifiedIndexes = possiblyModifiedIndexNames
    .map(indexName => {
      return getUpdatedIndexDiff(currentIndexByIndexName[indexName], nextIndexByIndexName[indexName]);
    })
    .filter(change => Boolean(change));

  return [
    ...indexToRemove.map(idx => ({
      type: GSIChange.Delete,
      indexName: idx,
    })),
    ...indexToAdd.map(idx => ({
      type: GSIChange.Add,
      indexName: idx,
    })),
    ...modifiedIndexes,
  ];
};

/**
 * Returns the type of iterative change needed to the index to support index updating
 * @param currentIndex DynamoDB GlobalSecondaryIndex in currently deployed table
 * @param nextIndex updated DynamoDB GlobalSecondaryIndex to be deployed in the next push
 */
export const getUpdatedIndexDiff = (currentIndex: GlobalSecondaryIndex, nextIndex: GlobalSecondaryIndex): IndexChange | undefined => {
  const diffs = getDiffs(currentIndex, nextIndex);
  if (currentIndex.IndexName instanceof IntrinsicFunction) {
    return;
  }
  const isModeifed = diffs?.some(diff => {
    const leaf = diff.path?.slice(-1)[0];
    return [
      'IndexName',
      'KeySchema',
      'AttributeName',
      'AttributeType',
      'KeyType',
      'NonKeyAttributes',
      'Projection',
      'ProjectionType',
    ].includes(leaf);
  });
  return isModeifed ? { type: GSIChange.Update, indexName: currentIndex.IndexName } : undefined;
};
