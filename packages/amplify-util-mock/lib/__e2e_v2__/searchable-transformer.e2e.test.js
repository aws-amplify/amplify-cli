"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_model_transformer_1 = require("@aws-amplify/graphql-model-transformer");
const graphql_searchable_transformer_1 = require("@aws-amplify/graphql-searchable-transformer");
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const utils_1 = require("../__e2e__/utils");
const openSearchEmulator = __importStar(require("@aws-amplify/amplify-opensearch-simulator"));
const amplify_cli_core_1 = require("amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const node_fetch_1 = __importDefault(require("node-fetch"));
jest.setTimeout(2000000);
let GRAPHQL_ENDPOINT;
let GRAPHQL_CLIENT;
let ddbEmulator = null;
let openSearchSimulator = null;
let dbPath = null;
let server;
describe('@searchable transformer', () => {
    let pathToSearchableMockResources;
    const todo101 = {
        name: 'name101',
        myint: 101,
        descriptions: ['desc1', 'desc2'],
        myfloat: 101.101,
        myenum: 'yes',
        mybool: true,
    };
    const todo102 = {
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
            const transformer = new graphql_transformer_core_1.GraphQLTransform({
                transformers: [new graphql_model_transformer_1.ModelTransformer(), new graphql_searchable_transformer_1.SearchableModelTransformer()],
                sandboxModeEnabled: true,
            });
            const out = await transformer.transform(validSchema);
            let ddbClient;
            ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await (0, utils_1.launchDDBLocal)());
            if (!(0, amplify_cli_core_1.isWindowsPlatform)()) {
                do {
                    pathToSearchableMockResources = path.join('/tmp', `amplify-cli-emulator-opensearch-${(0, uuid_1.v4)()}`);
                } while (fs.existsSync(pathToSearchableMockResources));
                jest
                    .spyOn(openSearchEmulator, 'getOpensearchLocalDirectory')
                    .mockReturnValue(path.join(pathToSearchableMockResources, openSearchEmulator.relativePathToOpensearchLocal));
                ({ emulator: openSearchSimulator } = await (0, utils_1.setupSearchableMockResources)(pathToSearchableMockResources));
            }
            const result = await (0, utils_1.deploy)(out, ddbClient, openSearchSimulator ? openSearchSimulator.url : undefined);
            server = result.simulator;
            GRAPHQL_ENDPOINT = server.url + '/graphql';
            (0, utils_1.logDebug)(`Using graphql url: ${GRAPHQL_ENDPOINT}`);
            const apiKey = result.config.appSync.apiKey;
            (0, utils_1.logDebug)(apiKey);
            GRAPHQL_CLIENT = new utils_1.GraphQLClient(GRAPHQL_ENDPOINT, {
                'x-api-key': apiKey,
            });
            if (!(0, amplify_cli_core_1.isWindowsPlatform)()) {
                await createTestRecords();
                await new Promise((r) => setTimeout(r, 5000));
            }
        }
        catch (e) {
            (0, utils_1.logDebug)('error when setting up test');
            (0, utils_1.logDebug)(e);
            throw e;
        }
    });
    afterAll(async () => {
        try {
            if (server) {
                await server.stop();
            }
            await (0, utils_1.terminateDDB)(ddbEmulator, dbPath);
            if (openSearchSimulator) {
                await openSearchSimulator.terminate();
                openSearchSimulator = null;
            }
            if (pathToSearchableMockResources) {
                fs.emptyDirSync(pathToSearchableMockResources);
            }
        }
        catch (e) {
            console.error(e);
            throw e;
        }
    });
    if ((0, amplify_cli_core_1.isWindowsPlatform)()) {
        test('@searchable allows the mock server to run on windows', async () => {
            const response = await GRAPHQL_CLIENT.query(`query {
          searchTodos {
            items {
              id
            }
          }
        }`, {});
            expect(response.data.searchTodos.items).toEqual([]);
        });
    }
    else {
        test('search query without filters returns all items', async () => {
            const { resultItems } = await searchTodos(null, [], []);
            expect(resultItems.length).toEqual(2);
            expect(resultItems.filter((item) => item.id === todo101.id)[0]).toEqual(todo101);
            expect(resultItems.filter((item) => item.id === todo102.id)[0]).toEqual(todo102);
        });
        test('filter using supported string type operations', async () => {
            const { resultItems } = await searchTodos({
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
            }, [], []);
            expect(resultItems.length).toEqual(2);
            expect(resultItems.filter((item) => item.id === todo101.id)[0]).toEqual(todo101);
            expect(resultItems.filter((item) => item.id === todo102.id)[0]).toEqual(todo102);
        });
        test('filter using match operations on string array type', async () => {
            const { resultItems } = await searchTodos({
                descriptions: { matchPhrasePrefix: 'desc' },
                or: [{ name: { matchPhrase: 'name102' } }, { name: { match: 'name101' } }],
            }, [], []);
            expect(resultItems.length).toEqual(2);
            expect(resultItems.filter((item) => item.id === todo101.id)[0]).toEqual(todo101);
            expect(resultItems.filter((item) => item.id === todo102.id)[0]).toEqual(todo102);
        });
        test('filter using supported integer type operations', async () => {
            const { resultItems } = await searchTodos({
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
            }, [], []);
            expect(resultItems.length).toEqual(2);
            expect(resultItems.filter((item) => item.id === todo101.id)[0]).toEqual(todo101);
            expect(resultItems.filter((item) => item.id === todo102.id)[0]).toEqual(todo102);
        });
        test('filter using supported float type operations', async () => {
            const { resultItems } = await searchTodos({
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
            }, [], []);
            expect(resultItems.length).toEqual(2);
            expect(resultItems.filter((item) => item.id === todo101.id)[0]).toEqual(todo101);
            expect(resultItems.filter((item) => item.id === todo102.id)[0]).toEqual(todo102);
        });
        test('filter using supported boolean type operations', async () => {
            const { resultItems } = await searchTodos({
                or: [{ mybool: { eq: true } }, { mybool: { ne: true } }],
            }, [], []);
            expect(resultItems.length).toEqual(2);
            expect(resultItems.filter((item) => item.id === todo101.id)[0]).toEqual(todo101);
            expect(resultItems.filter((item) => item.id === todo102.id)[0]).toEqual(todo102);
        });
        test('filter using supported enum type operations', async () => {
            const { resultItems } = await searchTodos({
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
            }, [], []);
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
            const { resultItems } = await searchTodos({ descriptions: { matchPhrasePrefix: 'desc' } }, [{ direction: 'desc', field: 'name' }], []);
            expect(resultItems.length).toEqual(2);
            expect(resultItems[0]).toEqual(todo102);
            expect(resultItems[1]).toEqual(todo101);
        });
        test('sort the results over multiple fields and with a filter', async () => {
            const { resultItems } = await searchTodos({ descriptions: { matchPhrasePrefix: 'desc' } }, [
                { direction: 'desc', field: 'name' },
                { direction: 'asc', field: 'descriptions' },
            ], []);
            expect(resultItems.length).toEqual(2);
            expect(resultItems[0]).toEqual(todo102);
            expect(resultItems[1]).toEqual(todo101);
        });
        test('aggregate scalar fields with a filter', async () => {
            const { resultItems, aggregateItems } = await searchTodos({ descriptions: { matchPhrasePrefix: 'desc' } }, [], [
                { field: 'myint', name: 'minMyInt', type: 'min' },
                { field: 'myint', name: 'maxMyInt', type: 'max' },
                { field: 'myint', name: 'avgMyInt', type: 'avg' },
                { field: 'myint', name: 'sumMyInt', type: 'sum' },
                { field: 'myfloat', name: 'minMyFloat', type: 'min' },
                { field: 'myfloat', name: 'maxMyFloat', type: 'max' },
                { field: 'myfloat', name: 'avgMyFloat', type: 'avg' },
                { field: 'myfloat', name: 'sumMyFloat', type: 'sum' },
            ]);
            expect(resultItems.length).toEqual(2);
            expect(resultItems.filter((item) => item.id === todo101.id)[0]).toEqual(todo101);
            expect(resultItems.filter((item) => item.id === todo102.id)[0]).toEqual(todo102);
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
            const { resultItems, aggregateItems } = await searchTodos({ descriptions: { matchPhrasePrefix: 'desc' } }, [], [
                { field: 'name', name: 'nameTerms', type: 'terms' },
                { field: 'descriptions', name: 'descriptionsTerms', type: 'terms' },
            ]);
            expect(resultItems.length).toEqual(2);
            expect(resultItems.filter((item) => item.id === todo101.id)[0]).toEqual(todo101);
            expect(resultItems.filter((item) => item.id === todo102.id)[0]).toEqual(todo102);
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
            expect(aggregateItems.filter((item) => item.name === 'descriptionsTerms')[0].result.buckets.sort()).toEqual(expectedDescriptionsTerms.sort());
        });
    }
    const createTestRecords = async () => {
        if (GRAPHQL_CLIENT && openSearchSimulator && openSearchSimulator.url) {
            const todo101Id = await createTodo(todo101.descriptions, todo101.myint, todo101.name, todo101.myfloat, todo101.myenum, todo101.mybool);
            todo101['id'] = todo101Id;
            const todo102Id = await createTodo(todo102.descriptions, todo102.myint, todo102.name, todo102.myfloat, todo102.myenum, todo102.mybool);
            todo102['id'] = todo102Id;
        }
    };
    const createTodo = async (descriptions, myint, name, myfloat, myenum, mybool) => {
        const response = await GRAPHQL_CLIENT.query(`mutation CreateTodo($input: CreateTodoInput!) {
          createTodo(input: $input) {
            id
            descriptions
            name
            myint
            myfloat
            myenum
            mybool
          }
      }`, {
            input: {
                descriptions: descriptions,
                name: name,
                myint: myint,
                myfloat: myfloat,
                myenum: myenum,
                mybool: mybool,
            },
        });
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
            const result = await (0, node_fetch_1.default)(url, {
                method: 'POST',
                body: payload,
                headers: {
                    'Content-type': 'application/json',
                },
            });
            const osResult = await result.json();
            expect(osResult.items.length).toBe(1);
            return todoId;
        }
        else {
            return todoId;
        }
    };
    const searchTodos = async (filter, sort, aggregates) => {
        const response = await GRAPHQL_CLIENT.query(`query SearchTodos(
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
      }`, {
            filter: filter,
            sort: sort,
            aggregates: aggregates,
        });
        const todoItems = response.data.searchTodos.items;
        expect(todoItems.length).toBeDefined();
        const aggregateItems = response.data.searchTodos.aggregateItems ? response.data.searchTodos.aggregateItems : [];
        return {
            resultItems: todoItems,
            aggregateItems: aggregateItems,
        };
    };
});
//# sourceMappingURL=searchable-transformer.e2e.test.js.map