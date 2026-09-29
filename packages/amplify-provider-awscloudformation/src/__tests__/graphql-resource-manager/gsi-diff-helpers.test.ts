import { GSIChange, getGSIDiffs } from '../../graphql-resource-manager/gsi-diff-helpers';
import * as diffTestHelpers from './gsi-test-helpers';

describe('gsi diff utils', () => {
  let firstIndex;
  let secondIndex;
  let thirdIndex;
  let fourthIndex;
  beforeEach(() => {
    firstIndex = {
      indexName: 'firstIndex',
      attributes: {
        hash: {
          name: 'foo',
          type: 'S',
        },
      },
    };

    secondIndex = {
      indexName: 'secondIndex',
      attributes: {
        hash: {
          name: 'bar',
          type: 'S',
        },
      },
    };

    thirdIndex = {
      indexName: 'thirdIndex',
      attributes: {
        hash: {
          name: 'baz',
          type: 'S',
        },
      },
    };

    fourthIndex = {
      indexName: 'fourthIndex',
      attributes: {
        hash: {
          name: 'qux',
          type: 'S',
        },
      },
    };
  });

  describe('add index', () => {
    it('Should return add when a new index is added', () => {
      const change = getGSIDiffs(...diffTestHelpers.makeTablePairsWithGSI([], [firstIndex]));
      expect(change).toHaveLength(1);
      expect(change[0].type).toEqual(GSIChange.Add);
      expect(change[0].indexName).toEqual('firstIndex');
    });

    it('should return add when an index is added to an table which already has another index', () => {
      const changes = getGSIDiffs(...diffTestHelpers.makeTablePairsWithGSI([firstIndex], [firstIndex, secondIndex]));
      expect(changes).toMatchObject([{ type: GSIChange.Add, indexName: 'secondIndex' }]);
    });

    it('should return as add when multiple index are added to an table which already has another index', () => {
      const changes = getGSIDiffs(
        ...diffTestHelpers.makeTablePairsWithGSI([firstIndex], [firstIndex, secondIndex, thirdIndex, fourthIndex]),
      );
      expect(changes).toMatchObject([
        {
          type: GSIChange.Add,
          indexName: 'secondIndex',
        },
        {
          type: GSIChange.Add,
          indexName: 'thirdIndex',
        },
        {
          type: GSIChange.Add,
          indexName: 'fourthIndex',
        },
      ]);
    });

    it('should return add when multiple indexs are added in the middle of to an existing GSI array', () => {
      const changes = getGSIDiffs(
        ...diffTestHelpers.makeTablePairsWithGSI([firstIndex, fourthIndex], [firstIndex, secondIndex, thirdIndex, fourthIndex]),
      );
      expect(changes).toMatchObject([
        {
          type: GSIChange.Add,
          indexName: 'secondIndex',
        },
        {
          type: GSIChange.Add,
          indexName: 'thirdIndex',
        },
      ]);
    });

    it('should return add when multiple indexes are added to end of GSI array', () => {
      const changes = getGSIDiffs(
        ...diffTestHelpers.makeTablePairsWithGSI([firstIndex, fourthIndex], [firstIndex, fourthIndex, secondIndex, thirdIndex]),
      );
      expect(changes).toMatchObject([
        {
          type: GSIChange.Add,
          indexName: 'secondIndex',
        },
        {
          type: GSIChange.Add,
          indexName: 'thirdIndex',
        },
      ]);
    });

    it('should return add when multiple indexes are added in to begining of GSI the array', () => {
      const changes = getGSIDiffs(
        ...diffTestHelpers.makeTablePairsWithGSI([firstIndex, fourthIndex], [secondIndex, thirdIndex, firstIndex, fourthIndex]),
      );
      expect(changes).toMatchObject([
        {
          type: GSIChange.Add,
          indexName: 'secondIndex',
        },
        {
          type: GSIChange.Add,
          indexName: 'thirdIndex',
        },
      ]);
    });
    it('should return add when multiple GSIs are added to a table with no GSI', () => {
      const changes = getGSIDiffs(...diffTestHelpers.makeTablePairsWithGSI(undefined, [firstIndex, secondIndex]));
      expect(changes).toHaveLength(2);
      expect(changes).toEqual([
        {
          type: GSIChange.Add,
          indexName: 'firstIndex',
        },
        {
          type: GSIChange.Add,
          indexName: 'secondIndex',
        },
      ]);
    });
  });
  describe('delete index', () => {
    it('should return delete when index is removed', () => {
      const changes = getGSIDiffs(...diffTestHelpers.makeTablePairsWithGSI([firstIndex], []));
      expect(changes).toEqual([
        {
          type: GSIChange.Delete,
          indexName: 'firstIndex',
        },
      ]);
    });

    it('should return delete when there are more than 1 GSI exists in the table', () => {
      const changes = getGSIDiffs(...diffTestHelpers.makeTablePairsWithGSI([firstIndex, secondIndex], [firstIndex]));
      expect(changes).toEqual([
        {
          type: GSIChange.Delete,
          indexName: 'secondIndex',
        },
      ]);
    });

    it('should return delete when multiple indexes are removed from the end of GSI array', () => {
      const changes = getGSIDiffs(
        ...diffTestHelpers.makeTablePairsWithGSI([firstIndex, secondIndex, thirdIndex, fourthIndex], [firstIndex]),
      );
      expect(changes).toMatchObject([
        {
          indexName: 'secondIndex',
          type: GSIChange.Delete,
        },
        {
          type: GSIChange.Delete,
          indexName: 'thirdIndex',
        },
        {
          type: GSIChange.Delete,
          indexName: 'fourthIndex',
        },
      ]);
    });

    it('should return delete when multiple indexes are removed from the middle of GSI array', () => {
      const changes = getGSIDiffs(
        ...diffTestHelpers.makeTablePairsWithGSI([firstIndex, secondIndex, thirdIndex, fourthIndex], [firstIndex, fourthIndex]),
      );
      expect(changes).toMatchObject([
        {
          indexName: 'secondIndex',
          type: GSIChange.Delete,
        },
        {
          type: GSIChange.Delete,
          indexName: 'thirdIndex',
        },
      ]);
    });

    it('should return delete when multiple index are removed from the begining of GSI array', () => {
      const changes = getGSIDiffs(
        ...diffTestHelpers.makeTablePairsWithGSI([firstIndex, secondIndex, thirdIndex, fourthIndex], [fourthIndex]),
      );
      expect(changes).toMatchObject([
        {
          indexName: 'firstIndex',
          type: GSIChange.Delete,
        },
        {
          indexName: 'secondIndex',
          type: GSIChange.Delete,
        },
        {
          type: GSIChange.Delete,
          indexName: 'thirdIndex',
        },
      ]);
    });

    it('should do a batch delete when all the GSIs are deleted', () => {
      const changes = getGSIDiffs(...diffTestHelpers.makeTablePairsWithGSI([firstIndex, secondIndex, thirdIndex], undefined));
      expect(changes).toEqual([
        {
          type: GSIChange.Delete,
          indexName: 'firstIndex',
        },
        {
          type: GSIChange.Delete,
          indexName: 'secondIndex',
        },
        {
          type: GSIChange.Delete,
          indexName: 'thirdIndex',
        },
      ]);
    });
  });
  describe('update', () => {
    it('should return an update when index gets sort key added', () => {
      const firstIndexUpdated = {
        ...firstIndex,
        attributes: {
          ...firstIndex.attributes,
          sort: {
            name: 'bar',
            type: 'S',
          },
        },
      };
      const changes = getGSIDiffs(...diffTestHelpers.makeTablePairsWithGSI([firstIndex], [firstIndexUpdated]));
      expect(changes).toEqual([
        {
          type: GSIChange.Update,
          indexName: 'firstIndex',
        },
      ]);
    });

    it('should return an update when index gets its hash key changed', () => {
      const firstIndex = {
        indexName: 'firstIndex',
        attributes: {
          hash: {
            name: 'foo',
            type: 'S',
          },
          sort: {
            name: 'bar',
            type: 'S',
          },
        },
      };
      const firstIndexUpdated = {
        ...firstIndex,
        attributes: {
          ...firstIndex.attributes,
          hash: {
            name: 'foo2',
            type: 'S',
          },
        },
      };

      const changes = getGSIDiffs(...diffTestHelpers.makeTablePairsWithGSI([firstIndex], [firstIndexUpdated]));
      expect(changes).toEqual([
        {
          type: GSIChange.Update,
          indexName: 'firstIndex',
        },
      ]);
    });

    it('should return an remove and an add when index name is changed', () => {
      const firstIndex = {
        indexName: 'firstIndex',
        attributes: {
          hash: {
            name: 'foo',
            type: 'S',
          },
          sort: {
            name: 'bar',
            type: 'S',
          },
        },
      };
      const firstIndexUpdated = {
        ...firstIndex,
        indexName: 'firstIndexRenamed',
      };

      const changes = getGSIDiffs(...diffTestHelpers.makeTablePairsWithGSI([firstIndex], [firstIndexUpdated]));
      expect(changes).toEqual([
        {
          type: GSIChange.Delete,
          indexName: 'firstIndex',
        },
        {
          type: GSIChange.Add,
          indexName: 'firstIndexRenamed',
        },
      ]);
    });

    it('should update when GSI has multiple indexes and one of the index gets sort key added', () => {
      const secondIndexWithSortKey = {
        ...secondIndex,
        attributes: {
          ...secondIndex.attributes,
          sort: {
            name: 'secondBar',
            type: 'N',
          },
        },
      };

      const changes = getGSIDiffs(
        ...diffTestHelpers.makeTablePairsWithGSI([firstIndex, secondIndex], [firstIndex, secondIndexWithSortKey]),
      );
      expect(changes).toEqual([
        {
          type: GSIChange.Update,
          indexName: 'secondIndex',
        },
      ]);
    });

    it('should update when GSI has multiple indexes and one of the index gets sort key added and the GSI array order changes', () => {
      const secondIndexWithSortKey = {
        ...secondIndex,
        attributes: {
          ...secondIndex.attributes,
          sort: {
            name: 'secondBar',
            type: 'N',
          },
        },
      };

      const changes = getGSIDiffs(
        ...diffTestHelpers.makeTablePairsWithGSI([firstIndex, secondIndex], [secondIndexWithSortKey, firstIndex]),
      );

      expect(changes).toEqual([
        {
          type: GSIChange.Update,
          indexName: 'secondIndex',
        },
      ]);
    });
  });

  describe('No op', () => {
    it('should return an empty list if GSIs are re-ordered in the array', () => {
      const changes = getGSIDiffs(
        ...diffTestHelpers.makeTablePairsWithGSI([firstIndex, secondIndex, thirdIndex], [secondIndex, firstIndex, thirdIndex]),
      );
      expect(changes).toHaveLength(0);
    });
  });

  describe('Mixed opertaion', () => {
    it('should support adding and deleting of indexes at once', () => {
      const changes = getGSIDiffs(...diffTestHelpers.makeTablePairsWithGSI([firstIndex, secondIndex], [thirdIndex]));

      expect(changes).toEqual([
        {
          type: GSIChange.Delete,
          indexName: 'firstIndex',
        },
        {
          type: GSIChange.Delete,
          indexName: 'secondIndex',
        },
        {
          type: GSIChange.Add,
          indexName: 'thirdIndex',
        },
      ]);
    });

    it('should support adding and updating of indexes at once', () => {
      const secondIndexUpdated = {
        ...secondIndex,
        indexName: 'secondIndexUpdated',
      };
      const changes = getGSIDiffs(
        ...diffTestHelpers.makeTablePairsWithGSI([firstIndex, secondIndex], [firstIndex, secondIndexUpdated, thirdIndex]),
      );

      expect(changes).toEqual([
        {
          type: GSIChange.Delete,
          indexName: 'secondIndex',
        },
        {
          type: GSIChange.Add,
          indexName: 'secondIndexUpdated',
        },
        {
          type: GSIChange.Add,
          indexName: 'thirdIndex',
        },
      ]);
    });

    it('should support deleting and updating of indexes at once', () => {
      const secondIndexUpdated = {
        ...secondIndex,
        indexName: 'secondIndexUpdated',
      };
      const changes = getGSIDiffs(...diffTestHelpers.makeTablePairsWithGSI([firstIndex, secondIndex], [secondIndexUpdated, thirdIndex]));

      expect(changes).toEqual([
        {
          type: GSIChange.Delete,
          indexName: 'firstIndex',
        },
        {
          type: GSIChange.Delete,
          indexName: 'secondIndex',
        },
        {
          type: GSIChange.Add,
          indexName: 'secondIndexUpdated',
        },
        {
          type: GSIChange.Add,
          indexName: 'thirdIndex',
        },
      ]);
    });

    it('should support add, delete and updating of indexes at once', () => {
      const secondIndexUpdated = {
        ...secondIndex,
        indexName: 'secondIndexUpdated',
      };
      const changes = getGSIDiffs(...diffTestHelpers.makeTablePairsWithGSI([firstIndex, secondIndex], [secondIndexUpdated, thirdIndex]));

      expect(changes).toEqual([
        {
          type: GSIChange.Delete,
          indexName: 'firstIndex',
        },
        {
          type: GSIChange.Delete,
          indexName: 'secondIndex',
        },
        {
          type: GSIChange.Add,
          indexName: 'secondIndexUpdated',
        },
        {
          type: GSIChange.Add,
          indexName: 'thirdIndex',
        },
      ]);
    });
  });
});
