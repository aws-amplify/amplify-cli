import { deploy, launchDDBLocal, logDebug, GraphQLClient, terminateDDB, setupSearchableMockResources } from '../__e2e__/utils';
import { AmplifyAppSyncSimulator } from '@aws-amplify/amplify-appsync-simulator';
import * as openSearchEmulator from '@aws-amplify/amplify-opensearch-simulator';
import { $TSAny, isWindowsPlatform } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 } from 'uuid';
import fetch from 'node-fetch';
import { transformAndSynth, defaultTransformParams } from './test-synthesizer';

jest.setTimeout(2000000);

let GRAPHQL_ENDPOINT: string;
let GRAPHQL_CLIENT: GraphQLClient;
let ddbEmulator = null;
let openSearchSimulator = null;
let dbPath = null;
let server: AmplifyAppSyncSimulator;

describe('@searchable transformer', () => {
  let pathToSearchableMockResources;

  // Test records
  const todo101: $TSAny = {
    name: 'name101',
    myint: 101,
    descriptions: ['desc1', 'desc2'],
    myfloat: 101.101,
    myenum: 'yes',
    mybool: true,
  };
  const todo102: $TSAny = {
    name: 'name102',
    myint: 102,
    descriptions: ['desc3', 'desc4'],
    myfloat: 102.102,
    myenum: 'no',
    mybool: false,
  };

  beforeAll(async () => {
    const validSchema = `
    type Todo @model @searchable {
      id: ID!
      name: String!
      descriptions: [String]
      myint: Int
      myfloat: Float
      myenum: MyEnum
      mybool: Boolean
    }
    enum MyEnum {
      yes
      no
    }`;

    try {
      const out = transformAndSynth({
        ...defaultTransformParams,
        schema: validSchema,
        transformParameters: {
          ...defaultTransformParams.transformParameters,
          sandboxModeEnabled: true,
        },
      });
      let ddbClient;
      ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await launchDDBLocal());

      if (!isWindowsPlatform()) {
        do {
          pathToSearchableMockResources = path.join('/tmp', `amplify-cli-emulator-opensearch-${v4()}`);
        } while (fs.existsSync(pathToSearchableMockResources));
        jest
          .spyOn(openSearchEmulator, 'getOpensearchLocalDirectory')
          .mockReturnValue(path.join(pathToSearchableMockResources, openSearchEmulator.relativePathToOpensearchLocal));
        ({ emulator: openSearchSimulator } = await setupSearchableMockResources(pathToSearchableMockResources));
      }

      const result = await deploy(out, ddbClient, openSearchSimulator ? openSearchSimulator.url : undefined);
      server = result.simulator;

      GRAPHQL_ENDPOINT = server.url + '/graphql';
      logDebug(`Using graphql url: ${GRAPHQL_ENDPOINT}`);

      const apiKey = result.config.appSync.apiKey;
      logDebug(apiKey);
      GRAPHQL_CLIENT = new GraphQLClient(GRAPHQL_ENDPOINT, {
        'x-api-key': apiKey,
      });

      // create test records and wait for 5 secs for local indices to update
      if (!isWindowsPlatform()) {
        await createTestRecords();
        await new Promise((r) => setTimeout(r, 5000));
      }
    } catch (e) {
      logDebug('error when setting up test');
      logDebug(e);
      throw e;
    }
  });

  afterAll(async () => {
    try {
      if (server) {
        await server.stop();
      }

      await terminateDDB(ddbEmulator, dbPath);

      if (openSearchSimulator) {
        await openSearchSimulator.terminate();
        openSearchSimulator = null;
      }

      if (pathToSearchableMockResources) {
        fs.emptyDirSync(pathToSearchableMockResources);
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  /**
   * Test queries below
   */

  if (isWindowsPlatform()) {
    test('@searchable allows the mock server to run on windows', async () => {
      const response = await GRAPHQL_CLIENT.query(
        `query {
          searchTodos {
            items {
              id
            }
          }
        }`,
        {},
      );

      expect(response.data.searchTodos.items).toEqual([]);
    });
  } else {
    test('search query without filters returns all items', async () => {
      const { resultItems } = await searchTodos(null, [], []);

      expect(resultItems.length).toEqual(2);
      expect(resultItems.filter((item) => item.id === todo101.id)[0]).toEqual(todo101);
      expect(resultItems.filter((item) => item.id === todo102.id)[0]).toEqual(todo102);
    });

    test('filter using supported string type operations', async () => {
      const { resultItems } = await searchTodos(
        {
          or: [
            { name: { eq: 'name101' } },
            {
              name: {
                ne: 'name101',
                exists: true,
                gt: 'aaaa102',
                lt: 'zzzz102',
                gte: 'name102',
                lte: 'name102',
                wildcard: '*102',
                regexp: 'na[a-z].[0-9].2',
                range: ['name102', 'name102'],
              },
            },
          ],
        },
        [],
        [],
      );

      expect(resultItems.length).toEqual(2);
      expect(resultItems.filter((item) => item.id === todo101.id)[0]).toEqual(todo101);
      expect(resultItems.filter((item) => item.id === todo102.id)[0]).toEqual(todo102);
    });

    test('filter using match operations on string array type', async () => {
      const { resultItems } = await searchTodos(
        {
          descriptions: { matchPhrasePrefix: 'desc' },
          or: [{ name: { matchPhrase: 'name102' } }, { name: { match: 'name101' } }],
        },
        [],
        [],
      );

      expect(resultItems.length).toEqual(2);
      expect(resultItems.filter((item) => item.id === todo101.id)[0]).toEqual(todo101);
      expect(resultItems.filter((item) => item.id === todo102.id)[0]).toEqual(todo102);
    });

    test('filter using supported integer type operations', async () => {
      const { resultItems } = await searchTodos(
        {
          or: [
            { myint: { eq: 101 } },
            {
              myint: {
                ne: 101,
                gt: 101,
                lt: 103,
                gte: 102,
                lte: 102,
                range: [102, 102],
              },
            },
          ],
        },
        [],
        [],
      );

      expect(resultItems.length).toEqual(2);
      expect(resultItems.filter((item) => item.id === todo101.id)[0]).toEqual(todo101);
      expect(resultItems.filter((item) => item.id === todo102.id)[0]).toEqual(todo102);
    });

    test('filter using supported float type operations', async () => {
      const { resultItems } = await searchTodos(
        {
          or: [
            { myfloat: { eq: 101.101 } },
            {
              myfloat: {
                ne: 101,
                gt: 102,
                lt: 103,
                gte: 102,
                lte: 103,
                range: [102, 103],
              },
            },
          ],
        },
        [],
        [],
      );

      expect(resultItems.length).toEqual(2);
      expect(resultItems.filter((item) => item.id === todo101.id)[0]).toEqual(todo101);
      expect(resultItems.filter((item) => item.id === todo102.id)[0]).toEqual(todo102);
    });

    test('filter using supported boolean type operations', async () => {
      const { resultItems } = await searchTodos(
        {
          or: [{ mybool: { eq: true } }, { mybool: { ne: true } }],
        },
        [],
        [],
      );

      expect(resultItems.length).toEqual(2);
      expect(resultItems.filter((item) => item.id === todo101.id)[0]).toEqual(todo101);
      expect(resultItems.filter((item) => item.id === todo102.id)[0]).toEqual(todo102);
    });

    test('filter using supported enum type operations', async () => {
      const { resultItems } = await searchTodos(
        {
          or: [
            { myenum: { eq: 'yes' } },
            {
              myenum: {
                ne: 'yes',
                exists: true,
                gt: 'aa',
                lt: 'zz',
                gte: 'no',
                lte: 'no',
                wildcard: '*o',
                regexp: 'n[a-z]+',
                range: ['no', 'no'],
                match: 'no',
                matchPhrase: 'no',
                matchPhrasePrefix: 'n',
              },
            },
          ],
        },
        [],
        [],
      );

      expect(resultItems.length).toEqual(2);
      expect(resultItems.filter((item) => item.id === todo101.id)[0]).toEqual(todo101);
      expect(resultItems.filter((item) => item.id === todo102.id)[0]).toEqual(todo102);
    });

    test('sort the results without any filter', async () => {
      const { resultItems } = await searchTodos({}, [{ direction: 'desc', field: 'name' }], []);

      expect(resultItems.length).toEqual(2);
      expect(resultItems[0]).toEqual(todo102);
      expect(resultItems[1]).toEqual(todo101);
    });

    test('sort the results with a filter', async () => {
      const { resultItems } = await searchTodos(
        { descriptions: { matchPhrasePrefix: 'desc' } },
        [{ direction: 'desc', field: 'name' }],
        [],
      );

      expect(resultItems.length).toEqual(2);
      expect(resultItems[0]).toEqual(todo102);
      expect(resultItems[1]).toEqual(todo101);
    });

    test('sort the results over multiple fields and with a filter', async () => {
      const { resultItems } = await searchTodos(
        { descriptions: { matchPhrasePrefix: 'desc' } },
        [
          { direction: 'desc', field: 'name' },
          { direction: 'asc', field: 'descriptions' },
        ],
        [],
      );

      expect(resultItems.length).toEqual(2);
      expect(resultItems[0]).toEqual(todo102);
      expect(resultItems[1]).toEqual(todo101);
    });

    test('aggregate scalar fields with a filter', async () => {
      const { resultItems, aggregateItems } = await searchTodos(
        { descriptions: { matchPhrasePrefix: 'desc' } },
        [],
        [
          { field: 'myint', name: 'minMyInt', type: 'min' },
          { field: 'myint', name: 'maxMyInt', type: 'max' },
          { field: 'myint', name: 'avgMyInt', type: 'avg' },
          { field: 'myint', name: 'sumMyInt', type: 'sum' },
          { field: 'myfloat', name: 'minMyFloat', type: 'min' },
          { field: 'myfloat', name: 'maxMyFloat', type: 'max' },
          { field: 'myfloat', name: 'avgMyFloat', type: 'avg' },
          { field: 'myfloat', name: 'sumMyFloat', type: 'sum' },
        ],
      );

      expect(resultItems.length).toEqual(2);
      expect(resultItems.filter((item) => item.id === todo101.id)[0]).toEqual(todo101);
      expect(resultItems.filter((item) => item.id === todo102.id)[0]).toEqual(todo102);

      // check correctness of aggregate results
      expect(aggregateItems.filter((item) => item.name === 'minMyInt')[0].result.value).toEqual(101);
      expect(aggregateItems.filter((item) => item.name === 'maxMyInt')[0].result.value).toEqual(102);
      expect(aggregateItems.filter((item) => item.name === 'avgMyInt')[0].result.value).toEqual(101.5);
      expect(aggregateItems.filter((item) => item.name === 'sumMyInt')[0].result.value).toEqual(203);
      expect(aggregateItems.filter((item) => item.name === 'minMyFloat')[0].result.value).toEqual(101.10099792480469);
      expect(aggregateItems.filter((item) => item.name === 'maxMyFloat')[0].result.value).toEqual(102.10199737548828);
      expect(aggregateItems.filter((item) => item.name === 'avgMyFloat')[0].result.value).toEqual(101.60149765014648);
      expect(aggregateItems.filter((item) => item.name === 'sumMyFloat')[0].result.value).toEqual(203.20299530029297);
    });

    test('aggregate terms query on string type fields with a filter', async () => {
      const { resultItems, aggregateItems } = await searchTodos(
        { descriptions: { matchPhrasePrefix: 'desc' } },
        [],
        [
          { field: 'name', name: 'nameTerms', type: 'terms' },
          { field: 'descriptions', name: 'descriptionsTerms', type: 'terms' },
        ],
      );

      expect(resultItems.length).toEqual(2);
      expect(resultItems.filter((item) => item.id === todo101.id)[0]).toEqual(todo101);
      expect(resultItems.filter((item) => item.id === todo102.id)[0]).toEqual(todo102);

      // check correctness of aggregate results
      const expectedNameTerms = [
        {
          doc_count: 1,
          key: todo101.name,
        },
        {
          doc_count: 1,
          key: todo102.name,
        },
      ];

      const expectedDescriptionsTerms = [
        {
          doc_count: 1,
          key: todo101.descriptions[0],
        },
        {
          doc_count: 1,
          key: todo101.descriptions[1],
        },
        {
          doc_count: 1,
          key: todo102.descriptions[0],
        },
        {
          doc_count: 1,
          key: todo102.descriptions[1],
        },
      ];

      expect(aggregateItems.filter((item) => item.name === 'nameTerms')[0].result.buckets.sort()).toEqual(expectedNameTerms.sort());
      expect(aggregateItems.filter((item) => item.name === 'descriptionsTerms')[0].result.buckets.sort()).toEqual(
        expectedDescriptionsTerms.sort(),
      );
    });
  }

  /**
   * Test helper methods
   */
  const createTestRecords = async () => {
    if (GRAPHQL_CLIENT && openSearchSimulator && openSearchSimulator.url) {
      const todo101Id = await createTodo(
        todo101.descriptions,
        todo101.myint,
        todo101.name,
        todo101.myfloat,
        todo101.myenum,
        todo101.mybool,
      );
      todo101['id'] = todo101Id;
      const todo102Id = await createTodo(
        todo102.descriptions,
        todo102.myint,
        todo102.name,
        todo102.myfloat,
        todo102.myenum,
        todo102.mybool,
      );
      todo102['id'] = todo102Id;
    }
  };

  const createTodo = async (
    descriptions: string[],
    myint: number,
    name: string,
    myfloat: number,
    myenum: string,
    mybool: boolean,
  ): Promise<string> => {
    const response = await GRAPHQL_CLIENT.query(
      `mutation CreateTodo($input: CreateTodoInput!) {
          createTodo(input: $input) {
            id
            descriptions
            name
            myint
            myfloat
            myenum
            mybool
          }
      }`,
      {
        input: {
          descriptions: descriptions,
          name: name,
          myint: myint,
          myfloat: myfloat,
          myenum: myenum,
          mybool: mybool,
        },
      },
    );

    expect(response.data.createTodo.id).toBeDefined();
    expect(response.data.createTodo.descriptions).toEqual(descriptions);
    expect(response.data.createTodo.myint).toEqual(myint);
    expect(response.data.createTodo.name).toEqual(name);
    expect(response.data.createTodo.myfloat).toEqual(myfloat);
    expect(response.data.createTodo.mybool).toEqual(mybool);
    expect(response.data.createTodo.myenum).toEqual(myenum);

    const todoId = response.data.createTodo.id;
    if (openSearchSimulator.url) {
      const url = openSearchSimulator.url.replace(/\/+$/, '') + '/_bulk';
      const payload = [
        JSON.stringify({ index: { _index: 'todo', _id: todoId } }),
        JSON.stringify({
          id: todoId,
          descriptions: descriptions,
          myint: myint,
          name: name,
          myfloat: myfloat,
          myenum: myenum,
          mybool: mybool,
        }),
        '',
      ].join('\n');
      const result = await fetch(url, {
        method: 'POST',
        body: payload,
        headers: {
          'Content-type': 'application/json',
        },
      });
      const osResult = await result.json();
      expect(osResult.items.length).toBe(1);
      return todoId;
    } else {
      return todoId;
    }
  };

  const searchTodos = async (
    filter: $TSAny,
    sort: $TSAny[],
    aggregates: $TSAny[],
  ): Promise<{ resultItems: $TSAny[]; aggregateItems: $TSAny[] }> => {
    const response = await GRAPHQL_CLIENT.query(
      `query SearchTodos(
          $filter: SearchableTodoFilterInput,
          $sort: [SearchableTodoSortInput],
          $aggregates: [SearchableTodoAggregationInput]
        ) {
        searchTodos (
          filter: $filter,
          sort: $sort,
          aggregates: $aggregates
        ) {
          items {
            id
            name
            descriptions
            myint
            myfloat
            myenum
            mybool
          }
          aggregateItems {
            name
            result {
              ... on SearchableAggregateScalarResult {
                value
              }
              ... on SearchableAggregateBucketResult {
                buckets {
                  doc_count
                  key
                }
              }
            }
          }
        }
      }`,
      {
        filter: filter,
        sort: sort,
        aggregates: aggregates,
      },
    );

    const todoItems = response.data.searchTodos.items;
    expect(todoItems.length).toBeDefined();
    const aggregateItems = response.data.searchTodos.aggregateItems ? response.data.searchTodos.aggregateItems : [];
    return {
      resultItems: todoItems,
      aggregateItems: aggregateItems,
    };
  };
});
