"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const appsync_client_1 = require("../__helpers__/appsync-client");
const __1 = require("../../");
describe('None data source', () => {
    const appSync = new __1.AmplifyAppSyncSimulator();
    const onInboxMock = jest.fn();
    let onInboxMockSubscription;
    beforeAll(async () => {
        appSync.init({
            appSync: {
                name: 'local-appsync',
                defaultAuthenticationType: {
                    authenticationType: __1.AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM,
                },
                additionalAuthenticationProviders: [
                    {
                        authenticationType: __1.AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
                        cognitoUserPoolConfig: {},
                    },
                ],
            },
            schema: {
                content: (0, fs_1.readFileSync)(require.resolve('./test-schema.graphql'), 'utf8'),
            },
            dataSources: [
                {
                    type: 'NONE',
                    name: 'noneDataSource',
                },
            ],
            resolvers: [
                {
                    fieldName: 'page',
                    typeName: 'Mutation',
                    kind: __1.RESOLVER_KIND.UNIT,
                    dataSourceName: 'noneDataSource',
                    requestMappingTemplate: `
          {
            "version": "2017-02-28",
            "payload": {
              "body": $util.toJson($context.arguments.body),
              "from": $util.toJson($context.identity.username),
              "to":  $util.toJson($context.arguments.to),
              "sentAt": "$util.time.nowISO8601()"
            }
          }
          `,
                    responseMappingTemplate: `$util.toJson($ctx.result)`,
                },
            ],
        });
        await appSync.start();
        onInboxMockSubscription = await appSync.pubsub.subscribe('inbox', onInboxMock);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    afterAll(async () => {
        await appSync.pubsub.unsubscribe(onInboxMockSubscription);
        await appSync.stop();
    });
    test('`page` should trigger `inbox` subscription with given parameters', async () => {
        const { page } = await (0, appsync_client_1.appSyncClient)({
            appSync,
            auth: {
                type: __1.AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
                username: 'mockUser',
                groups: ['testGroup'],
            },
            query: (0, appsync_client_1.gql) `
        mutation Page {
          page(to: "Nadia", body: "Hello, World!") {
            body
            to
            from
            sentAt
          }
        }
      `,
        });
        expect(page).toMatchObject({
            body: 'Hello, World!',
            from: 'mockUser',
            sentAt: expect.any(String),
            to: 'Nadia',
        });
        await new Promise((resolve) => setTimeout(resolve, 500));
        expect(onInboxMock).toHaveBeenCalledTimes(1);
        expect(onInboxMock).toHaveBeenCalledWith(page);
    });
});
//# sourceMappingURL=none.test.js.map