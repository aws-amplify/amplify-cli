import { DISABLE_GSI_LIMIT_CHECK_OPTION } from '../../graphql-resource-manager/amplify-graphql-resource-manager';
import * as gsiUtils from '../../graphql-resource-manager/dynamodb-gsi-helpers';

import { makeTableWithGSI } from './gsi-test-helpers';

describe('DynamoDB GSI Utils', () => {
  describe('getGSIDetails', () => {
    describe('With hash key', () => {
      const table1 = makeTableWithGSI({
        gsis: [
          {
            indexName: 'index1',
            attributes: {
              hash: {
                name: 'title',
                type: 'N',
              },
            },
          },
        ],
      });

      it('should get the index', () => {
        const gsiDetils = gsiUtils.getGSIDetails('index1', table1);
        expect(gsiDetils).toBeDefined();
        expect(gsiDetils?.gsi).toEqual(table1.Properties.GlobalSecondaryIndexes?.[0]);
      });

      it('should get the attributes used in index', () => {
        const gsiDetils = gsiUtils.getGSIDetails('index1', table1);
        expect(gsiDetils).toBeDefined();
        expect(gsiDetils?.attributeDefinition).toEqual([
          {
            AttributeName: 'title',
            AttributeType: 'N',
          },
        ]);
      });
    });

    describe('with hash and sort key', () => {
      const table1 = makeTableWithGSI({
        gsis: [
          {
            indexName: 'index1',
            attributes: {
              hash: {
                name: 'title',
                type: 'S',
              },
              sort: {
                name: 'createdAt',
                type: 'S',
              },
            },
          },
        ],
      });
      it('should get the index', () => {
        const gsiDetils = gsiUtils.getGSIDetails('index1', table1);
        expect(gsiDetils).toBeDefined();
        expect(gsiDetils?.gsi).toEqual(table1.Properties.GlobalSecondaryIndexes?.[0]);
      });

      it('should get the attributes used in index', () => {
        const gsiDetils = gsiUtils.getGSIDetails('index1', table1);
        expect(gsiDetils).toBeDefined();
        expect(gsiDetils?.attributeDefinition).toEqual([
          {
            AttributeName: 'title',
            AttributeType: 'S',
          },
          {
            AttributeName: 'createdAt',
            AttributeType: 'S',
          },
        ]);
      });
    });
  });

  describe('addGSI', () => {
    const gsiItem = {
      attributeDefinition: [
        {
          AttributeName: 'id',
          AttributeType: 'N',
        },
        {
          AttributeName: 'title',
          AttributeType: 'N',
        },
      ],
      gsi: {
        IndexName: 'byTitileAndId',
        KeySchema: [
          {
            AttributeName: 'title',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'id',
            KeyType: 'SORT',
          },
        ],
        Projection: {},
      },
    };
    it('should add GSI to a table with no GSI', () => {
      const tableWithNoGSI = makeTableWithGSI({
        gsis: [],
      });
      const updatedTable = gsiUtils.addGSI(gsiItem, tableWithNoGSI, false);
      expect(updatedTable).toBeDefined();
      expect(updatedTable).not.toEqual(tableWithNoGSI);
      expect(updatedTable.Properties.AttributeDefinitions).toEqual([
        {
          AttributeName: 'id',
          AttributeType: 'S',
        },
        {
          AttributeName: 'title',
          AttributeType: 'N',
        },
      ]);
      expect(updatedTable.Properties.GlobalSecondaryIndexes).toEqual([gsiItem.gsi]);
    });

    it('should add GSI to a table with existing GSI', () => {
      const tableWithGSI = makeTableWithGSI({
        gsis: [
          {
            indexName: 'byDescription',
            attributes: {
              hash: { name: 'description' },
            },
          },
        ],
      });
      const updatedTable = gsiUtils.addGSI(gsiItem, tableWithGSI, false);
      expect(updatedTable).toBeDefined();
      expect(updatedTable).not.toEqual(tableWithGSI);
      expect(updatedTable.Properties.AttributeDefinitions).toEqual([
        {
          AttributeName: 'id',
          AttributeType: 'S',
        },
        {
          AttributeName: 'description',
          AttributeType: 'S',
        },
        {
          AttributeName: 'title',
          AttributeType: 'N',
        },
      ]);
      expect(updatedTable.Properties.GlobalSecondaryIndexes).toEqual([
        ...(tableWithGSI.Properties.GlobalSecondaryIndexes as []),
        gsiItem.gsi,
      ]);
    });

    it('should throw error when an index with the same name exists', () => {
      const tableWithGSI = makeTableWithGSI({
        gsis: [
          {
            indexName: 'byTitileAndId',
            attributes: {
              hash: { name: 'title' },
            },
          },
        ],
      });
      expect(() => gsiUtils.addGSI(gsiItem, tableWithGSI, false)).toThrowError(
        `An index with name ${gsiItem.gsi.IndexName} already exists`,
      );
    });

    it(`should throw error when adding new index to a table with ${gsiUtils.MAX_GSI_PER_TABLE} GSIs`, () => {
      const tableWithMaxGSI = makeTableWithGSI({
        gsis: new Array(gsiUtils.MAX_GSI_PER_TABLE).fill(0).reduce((acc, i, idx) => {
          return [
            ...acc,
            {
              indexName: `byTitile${idx}AndId`,
              attributes: {
                hash: { name: `title${idx}` },
              },
            },
          ];
        }, []),
      });
      expect(() => gsiUtils.addGSI(gsiItem, tableWithMaxGSI, false)).toThrowError(
        `DynamoDB ${tableWithMaxGSI.Properties.TableName} can have max of ${gsiUtils.MAX_GSI_PER_TABLE} GSIs. To disable this check, use the --${DISABLE_GSI_LIMIT_CHECK_OPTION} option.`,
      );
    });

    it(`should not throw error when adding new index to a table with ${gsiUtils.MAX_GSI_PER_TABLE} GSIs if disableGsiLimitcheck is configured`, () => {
      const tableWithMaxGSI = makeTableWithGSI({
        gsis: new Array(gsiUtils.MAX_GSI_PER_TABLE).fill(0).reduce((acc, i, idx) => {
          return [
            ...acc,
            {
              indexName: `byTitile${idx}AndId`,
              attributes: {
                hash: { name: `title${idx}` },
              },
            },
          ];
        }, []),
      });
      expect(() => gsiUtils.addGSI(gsiItem, tableWithMaxGSI, true)).not.toThrowError();
    });

    it('should not have duplicate AttributeDefinitions', () => {
      const tableWithGSI = makeTableWithGSI({
        gsis: [
          {
            indexName: 'originalTitleAndId',
            attributes: {
              hash: {
                name: 'title',
                type: 'S',
              },
              sort: {
                name: 'id',
                type: 'S',
              },
            },
          },
        ],
      });
      const updatedTable = gsiUtils.addGSI(gsiItem, tableWithGSI, false);
      expect(updatedTable).toBeDefined();
      expect(updatedTable).not.toEqual(tableWithGSI);
      expect(updatedTable.Properties.AttributeDefinitions).toEqual([
        {
          AttributeName: 'id',
          AttributeType: 'S',
        },
        {
          AttributeName: 'title',
          AttributeType: 'S',
        },
      ]);
      expect(updatedTable.Properties.GlobalSecondaryIndexes).toEqual([
        ...(tableWithGSI.Properties.GlobalSecondaryIndexes as []),
        gsiItem.gsi,
      ]);
    });
  });
  describe('removeGsi', () => {
    const tableDefinition = {
      gsis: [
        {
          indexName: 'byTitle',
          attributes: {
            hash: {
              name: 'title',
              type: 'S',
            },
            sort: {
              name: 'id',
              type: 'S',
            },
          },
        },
      ],
    };
    it('should throw error if there are no GSIs in the table', () => {
      const tableWithNoGSI = makeTableWithGSI({ gsis: [] });
      expect(() => gsiUtils.removeGSI('missingGsi', tableWithNoGSI)).toThrowError('No GSIs are present in the table');
    });

    it('should throw error when trying to remove index which does not exist', () => {
      const tableWitGSI = makeTableWithGSI(tableDefinition);
      expect(() => gsiUtils.removeGSI('missingGsi', tableWitGSI)).toThrowError(`Table MyTable does not contain GSI missingGsi`);
    });
    it('should remove index when the GSI is present', () => {
      const tableWitGSI = makeTableWithGSI(tableDefinition);

      const updatedTable = gsiUtils.removeGSI('byTitle', tableWitGSI);

      expect(updatedTable).not.toEqual(tableWitGSI);
      expect(updatedTable.Properties.GlobalSecondaryIndexes).toBeUndefined();

      expect(updatedTable.Properties.AttributeDefinitions).not.toEqual(tableWitGSI.Properties.AttributeDefinitions);
      expect(updatedTable.Properties.AttributeDefinitions).toEqual([
        {
          AttributeName: 'id',
          AttributeType: 'S',
        },
      ]);
    });

    it('should keep the attributes that are in other indices even if the same is used in removed index', () => {
      const tableWitGSI = makeTableWithGSI({
        ...tableDefinition,
        gsis: [
          ...tableDefinition.gsis,
          {
            indexName: 'byTitleAndId',
            attributes: {
              hash: {
                name: 'title',
                type: 'S',
              },
              sort: {
                name: 'updatedAt',
                type: 'N',
              },
            },
          },
        ],
      });
      const updatedTable = gsiUtils.removeGSI('byTitle', tableWitGSI);

      expect(updatedTable).not.toEqual(tableWitGSI);
      expect(updatedTable.Properties.GlobalSecondaryIndexes).toHaveLength(1);
      expect(updatedTable.Properties.GlobalSecondaryIndexes).toEqual([
        {
          IndexName: 'byTitleAndId',
          KeySchema: [
            {
              AttributeName: 'title',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'updatedAt',
              KeyType: 'SORT',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
        },
      ]);

      expect(updatedTable.Properties.AttributeDefinitions).toEqual(tableWitGSI.Properties.AttributeDefinitions);
      expect(updatedTable.Properties.AttributeDefinitions).toEqual([
        {
          AttributeName: 'id',
          AttributeType: 'S',
        },
        {
          AttributeName: 'title',
          AttributeType: 'S',
        },
        {
          AttributeName: 'updatedAt',
          AttributeType: 'N',
        },
      ]);
    });

    it('should keep the attributes that are in table KeySchema even if the same is used in removed index', () => {
      const tableWitGSI = makeTableWithGSI({
        ...tableDefinition,
      });
      const updatedTable = gsiUtils.removeGSI('byTitle', tableWitGSI);

      expect(updatedTable).not.toEqual(tableWitGSI);
      expect(updatedTable.Properties?.GlobalSecondaryIndexes).toBeUndefined();
      expect(updatedTable.Properties.AttributeDefinitions).toEqual([
        {
          AttributeName: 'id',
          AttributeType: 'S',
        },
      ]);
    });
  });
});
