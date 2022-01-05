import { readFileSync } from 'fs';
import { gql, appSyncClient } from '../__helpers__/appsync-client';
import { AmplifyAppSyncSimulator, AmplifyAppSyncSimulatorAuthenticationType, RESOLVER_KIND } from '../../';

describe('None data source', () => {
  const appSync = new AmplifyAppSyncSimulator();
  const onInboxMock = jest.fn();
  let onInboxMockSubscription;

  beforeAll(async () => {
    appSync.init({
      appSync: {
        name: 'local-appsync',
        defaultAuthenticationType: {
          authenticationType: AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM,
        },
        additionalAuthenticationProviders: [
          {
            authenticationType: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
            cognitoUserPoolConfig: {},
          },
        ],
      },
      schema: {
        content: readFileSync(require.resolve('./test-schema.graphql'), 'utf8'),
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
          kind: RESOLVER_KIND.UNIT,
          dataSourceName: 'noneDataSource',
          // from example at https://docs.aws.amazon.com/appsync/latest/devguide/tutorial-local-resolvers.html
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
    const { page } = await appSyncClient<{ page: unknown }>({
      appSync,
      auth: {
        type: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
        username: 'mockUser',
        groups: ['testGroup'],
      },
      query: gql`
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

    // give pubsub some time to deliver message
    await new Promise(resolve => setTimeout(resolve, 500));
    expect(onInboxMock).toHaveBeenCalledTimes(1);
    expect(onInboxMock).toHaveBeenCalledWith(page);
  });
});
