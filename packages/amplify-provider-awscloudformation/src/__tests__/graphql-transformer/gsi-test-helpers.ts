import { DynamoDB } from 'cloudform';
import { GlobalSecondaryIndex, AttributeDefinition } from 'cloudform-types/types/dynamoDb/table';

export type GSIDefinition = {
  indexName: string;
  attributes: {
    hash: {
      name: string;
      type?: string;
    };
    sort?: {
      name: string;
      type?: string;
    };
  };
};

export const makeTableWithGSI = (props: { gsis?: GSIDefinition[] }): DynamoDB.Table => {
  const gsis: GlobalSecondaryIndex[] | undefined = props.gsis?.map<GlobalSecondaryIndex>(gsi => {
    const index: GlobalSecondaryIndex = {
      IndexName: gsi.indexName,
      Projection: {
        ProjectionType: 'ALL',
      },
      KeySchema: [
        {
          AttributeName: gsi.attributes.hash.name,
          KeyType: 'HASH',
        },
        ...(gsi.attributes.sort
          ? [
              {
                AttributeName: gsi.attributes.sort.name,
                KeyType: 'SORT',
              },
            ]
          : []),
      ],
    };
    return index;
  });

  const attributeSet = new Set(['id']);

  const attrs = props.gsis?.reduce<AttributeDefinition[]>((acc, gsi) => {
    if (!attributeSet.has(gsi.attributes.hash.name)) {
      attributeSet.add(gsi.attributes.hash.name);
      acc.push({
        AttributeName: gsi.attributes.hash.name,
        AttributeType: gsi.attributes.hash.type || 'S',
      });
    }

    if (gsi.attributes.sort && !attributeSet.has(gsi.attributes.sort.name)) {
      attributeSet.add(gsi.attributes.hash.name);

      acc.push({
        AttributeName: gsi.attributes.sort.name,
        AttributeType: gsi.attributes.sort.type || 'S',
      });
    }

    return acc;
  }, []);

  const table: DynamoDB.Table = new DynamoDB.Table({
    TableName: 'MyTable',
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S',
      },
      ...(attrs ?? []),
    ],
    ...(gsis ? { GlobalSecondaryIndexes: gsis } : {}),
  });
  return table;
};

export const makeTablePairsWithGSI = (
  gis1: GSIDefinition[] | undefined,
  gis2: GSIDefinition[] | undefined,
): [DynamoDB.Table, DynamoDB.Table] => {
  return [makeTableWithGSI({ gsis: gis1 }), makeTableWithGSI({ gsis: gis2 })];
};
