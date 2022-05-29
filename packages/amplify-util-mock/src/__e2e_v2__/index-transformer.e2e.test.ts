import { deploy, launchDDBLocal, logDebug, terminateDDB, GraphQLClient } from '../__e2e__/utils';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { FeatureFlagProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { PrimaryKeyTransformer, IndexTransformer } from '@aws-amplify/graphql-index-transformer';
import { AmplifyAppSyncSimulator } from 'amplify-appsync-simulator';
import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';

jest.setTimeout(2000000);

let GRAPHQL_ENDPOINT: string;
let GRAPHQL_CLIENT: GraphQLClient;
let ddbEmulator = null;
let dbPath = null;
let server: AmplifyAppSyncSimulator;

describe('@index transformer', () => {
  beforeAll(async () => {
    const validSchema = `
      type Order @model @auth(rules: [{ allow: public }]) {
        customerEmail: String! @primaryKey(sortKeyFields: ["createdAt"])
        createdAt: String!
        orderId: ID!
      }

      type Customer @model @auth(rules: [{ allow: public }]) {
        email: String! @primaryKey
        addresslist: [String]
        username: String
      }

      type Item @model @auth(rules: [{ allow: public }]) {
        orderId: ID! @primaryKey(sortKeyFields: ["status", "createdAt"])
        status: Status! @index(name: "ByStatus", queryField: "itemsByStatus", sortKeyFields: ["createdAt"])
        createdAt: AWSDateTime! @index(name: "ByCreatedAt", queryField: "itemsByCreatedAt", sortKeyFields: ["status"])
        name: String!
      }

      enum Status {
        DELIVERED
        IN_TRANSIT
        PENDING
        UNKNOWN
      }

      type ShippingUpdate @model @auth(rules: [{ allow: public }]) {
        id: ID!
        orderId: ID @index(name: "ByOrderItemStatus", sortKeyFields: ["itemId", "status"], queryField: "shippingUpdates")
        itemId: ID
        status: Status
        name: String
      }

      type TypeWithLSI @model @auth(rules: [{ allow: public }]) {
        id: ID! @primaryKey(sortKeyFields: ["updatedAt"])
          @index(name: "BySpending" , sortKeyFields: ["totalSpending"])
          @index(name: "ByAttendance", sortKeyFields: ["totalAttendance"])
        totalSpending: Int!
        totalAttendance: Int!
        createdAt: AWSDateTime
        updatedAt: AWSDateTime!
      }`;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new IndexTransformer(), new AuthTransformer()],
      featureFlags: {
        getBoolean: name => (name === 'improvePluralization' ? true : false),
      } as FeatureFlagProvider,
    });
    const out = transformer.transform(validSchema);
    let ddbClient;
    ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await launchDDBLocal());
    const result = await deploy(out, ddbClient);
    server = result.simulator;

    GRAPHQL_ENDPOINT = server.url + '/graphql';
    logDebug(`Using graphql url: ${GRAPHQL_ENDPOINT}`);

    const apiKey = result.config.appSync.apiKey;
    logDebug(apiKey);
    GRAPHQL_CLIENT = new GraphQLClient(GRAPHQL_ENDPOINT, { 'x-api-key': apiKey });
  });

  afterAll(async () => {
    if (server) {
      await server.stop();
    }
    await terminateDDB(ddbEmulator, dbPath);
  });

  /**
   * Test queries below
   */
  test('Test next token with key', async () => {
    const status = 'PENDING';
    const createdAt = '2019-06-06T00:01:01.000Z';

    await createItem('order1', status, 'item1', '2019-01-06T00:01:01.000Z');
    await createItem('order2', status, 'item2', '2019-02-06T00:01:01.000Z');
    await createItem('order3', status, 'item3', '2019-03-06T00:01:01.000Z');
    await createItem('order4', status, 'item4', '2019-06-06T00:01:01.000Z');

    const items = await itemsByStatus(status, { beginsWith: '2019' }, 2);
    expect(items.data).toBeDefined();
    const itemsNextToken = items.data.itemsByStatus.nextToken;
    expect(itemsNextToken).toBeDefined();

    expect(items.data.itemsByStatus.items).toHaveLength(2);
    expect(items.data.itemsByStatus.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ orderId: 'order1', name: 'item1' }),
        expect.objectContaining({ orderId: 'order2', name: 'item2' }),
      ]),
    );

    const items2 = await itemsByStatus(status, { beginsWith: '2019' }, 2, itemsNextToken);
    expect(items2.data).toBeDefined();
    expect(items2.data.itemsByStatus.items).toHaveLength(2);
    expect(items2.data.itemsByStatus.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ orderId: 'order3', name: 'item3' }),
        expect.objectContaining({ orderId: 'order4', name: 'item4' }),
      ]),
    );

    await deleteItem('order1', status, createdAt);
    await deleteItem('order2', status, createdAt);
    await deleteItem('order3', status, createdAt);
    await deleteItem('order4', status, createdAt);
  });

  test('Test getX with a two part primary key.', async () => {
    const order1 = await createOrder('test@gmail.com', '1');
    const getOrder1 = await getOrder('test@gmail.com', order1.data.createOrder.createdAt);
    expect(getOrder1.data.getOrder.orderId).toEqual('1');
  });

  test('Test updateX with a two part primary key.', async () => {
    const order2 = await createOrder('test3@gmail.com', '2');
    let getOrder2 = await getOrder('test3@gmail.com', order2.data.createOrder.createdAt);
    expect(getOrder2.data.getOrder.orderId).toEqual('2');
    const updateOrder2 = await updateOrder('test3@gmail.com', order2.data.createOrder.createdAt, '3');
    expect(updateOrder2.data.updateOrder.orderId).toEqual('3');
    getOrder2 = await getOrder('test3@gmail.com', order2.data.createOrder.createdAt);
    expect(getOrder2.data.getOrder.orderId).toEqual('3');
  });

  test('Test deleteX with a two part primary key.', async () => {
    const order2 = await createOrder('test2@gmail.com', '2');
    let getOrder2 = await getOrder('test2@gmail.com', order2.data.createOrder.createdAt);
    expect(getOrder2.data.getOrder.orderId).toEqual('2');
    const delOrder2 = await deleteOrder('test2@gmail.com', order2.data.createOrder.createdAt);
    expect(delOrder2.data.deleteOrder.orderId).toEqual('2');
    getOrder2 = await getOrder('test2@gmail.com', order2.data.createOrder.createdAt);
    expect(getOrder2.data.getOrder).toBeNull();
  });

  test('Test getX with a three part primary key', async () => {
    const item1 = await createItem('1', 'PENDING', 'item1');
    const getItem1 = await getItem('1', 'PENDING', item1.data.createItem.createdAt);
    expect(getItem1.data.getItem.orderId).toEqual('1');
    expect(getItem1.data.getItem.status).toEqual('PENDING');
  });

  test('Test updateX with a three part primary key.', async () => {
    const item2 = await createItem('2', 'PENDING', 'item2');
    let getItem2 = await getItem('2', 'PENDING', item2.data.createItem.createdAt);
    expect(getItem2.data.getItem.orderId).toEqual('2');
    const updateItem2 = await updateItem('2', 'PENDING', item2.data.createItem.createdAt, 'item2.1');
    expect(updateItem2.data.updateItem.name).toEqual('item2.1');
    getItem2 = await getItem('2', 'PENDING', item2.data.createItem.createdAt);
    expect(getItem2.data.getItem.name).toEqual('item2.1');
  });

  test('Test deleteX with a three part primary key.', async () => {
    const item3 = await createItem('3', 'IN_TRANSIT', 'item3');
    let getItem3 = await getItem('3', 'IN_TRANSIT', item3.data.createItem.createdAt);
    expect(getItem3.data.getItem.name).toEqual('item3');
    const delItem3 = await deleteItem('3', 'IN_TRANSIT', item3.data.createItem.createdAt);
    expect(delItem3.data.deleteItem.name).toEqual('item3');
    getItem3 = await getItem('3', 'IN_TRANSIT', item3.data.createItem.createdAt);
    expect(getItem3.data.getItem).toBeNull();
  });

  test('Test listX with three part primary key.', async () => {
    const hashKey = 'TEST_LIST_ID';
    await createItem(hashKey, 'IN_TRANSIT', 'list1', '2018-01-01T00:01:01.000Z');
    await createItem(hashKey, 'PENDING', 'list2', '2018-06-01T00:01:01.000Z');
    await createItem(hashKey, 'PENDING', 'item3', '2018-09-01T00:01:01.000Z');
    let items = await listItem(undefined);
    expect(items.data.listItems.items.length).toBeGreaterThan(0);
    items = await listItem(hashKey);
    expect(items.data.listItems.items).toHaveLength(3);
    items = await listItem(hashKey, { beginsWith: { status: 'PENDING' } });
    expect(items.data.listItems.items).toHaveLength(2);
    items = await listItem(hashKey, { beginsWith: { status: 'IN_TRANSIT' } });
    expect(items.data.listItems.items).toHaveLength(1);
    items = await listItem(hashKey, {
      beginsWith: { status: 'PENDING', createdAt: '2018-09' },
    });
    expect(items.data.listItems.items).toHaveLength(1);
    items = await listItem(hashKey, {
      eq: { status: 'PENDING', createdAt: '2018-09-01T00:01:01.000Z' },
    });
    expect(items.data.listItems.items).toHaveLength(1);
    items = await listItem(hashKey, {
      between: [
        { status: 'PENDING', createdAt: '2018-08-01' },
        { status: 'PENDING', createdAt: '2018-10-01' },
      ],
    });
    expect(items.data.listItems.items).toHaveLength(1);
    items = await listItem(hashKey, {
      gt: { status: 'PENDING', createdAt: '2018-08-1' },
    });
    expect(items.data.listItems.items).toHaveLength(1);
    items = await listItem(hashKey, {
      ge: { status: 'PENDING', createdAt: '2018-09-01T00:01:01.000Z' },
    });
    expect(items.data.listItems.items).toHaveLength(1);
    items = await listItem(hashKey, {
      lt: { status: 'IN_TRANSIT', createdAt: '2018-01-02' },
    });
    expect(items.data.listItems.items).toHaveLength(1);
    items = await listItem(hashKey, {
      le: { status: 'IN_TRANSIT', createdAt: '2018-01-01T00:01:01.000Z' },
    });
    expect(items.data.listItems.items).toHaveLength(1);
    await deleteItem(hashKey, 'IN_TRANSIT', '2018-01-01T00:01:01.000Z');
    await deleteItem(hashKey, 'PENDING', '2018-06-01T00:01:01.000Z');
    await deleteItem(hashKey, 'PENDING', '2018-09-01T00:01:01.000Z');
  });

  test('Test query with three part secondary key.', async () => {
    const hashKey = 'UNKNOWN';
    await createItem('order1', 'UNKNOWN', 'list1', '2018-01-01T00:01:01.000Z');
    await createItem('order2', 'UNKNOWN', 'list2', '2018-06-01T00:01:01.000Z');
    await createItem('order3', 'UNKNOWN', 'item3', '2018-09-01T00:01:01.000Z');
    let items = await itemsByStatus(undefined);
    expect(items.data).toBeNull();
    expect(items.errors.length).toBeGreaterThan(0);
    items = await itemsByStatus(hashKey);
    expect(items.data.itemsByStatus.items).toHaveLength(3);
    items = await itemsByStatus(hashKey, { beginsWith: '2018-09' });
    expect(items.data.itemsByStatus.items).toHaveLength(1);
    items = await itemsByStatus(hashKey, { eq: '2018-09-01T00:01:01.000Z' });
    expect(items.data.itemsByStatus.items).toHaveLength(1);
    items = await itemsByStatus(hashKey, {
      between: ['2018-08-01', '2018-10-01'],
    });
    expect(items.data.itemsByStatus.items).toHaveLength(1);
    items = await itemsByStatus(hashKey, { gt: '2018-08-01' });
    expect(items.data.itemsByStatus.items).toHaveLength(1);
    items = await itemsByStatus(hashKey, { ge: '2018-09-01' });
    expect(items.data.itemsByStatus.items).toHaveLength(1);
    items = await itemsByStatus(hashKey, { lt: '2018-07-01' });
    expect(items.data.itemsByStatus.items).toHaveLength(2);
    items = await itemsByStatus(hashKey, { le: '2018-06-01' });
    expect(items.data.itemsByStatus.items).toHaveLength(1);
    items = await itemsByStatus(undefined, { le: '2018-09-01' });
    expect(items.data).toBeNull();
    expect(items.errors.length).toBeGreaterThan(0);
    await deleteItem('order1', hashKey, '2018-01-01T00:01:01.000Z');
    await deleteItem('order2', hashKey, '2018-06-01T00:01:01.000Z');
    await deleteItem('order3', hashKey, '2018-09-01T00:01:01.000Z');
  });

  test('Test query with three part secondary key, where sort key is an enum.', async () => {
    const hashKey = '2018-06-01T00:01:01.000Z';
    const sortKey = 'UNKNOWN';
    await createItem('order1', sortKey, 'list1', '2018-01-01T00:01:01.000Z');
    await createItem('order2', sortKey, 'list2', hashKey);
    await createItem('order3', sortKey, 'item3', '2018-09-01T00:01:01.000Z');
    let items = await itemsByCreatedAt(undefined);
    expect(items.data).toBeNull();
    expect(items.errors.length).toBeGreaterThan(0);
    items = await itemsByCreatedAt(hashKey);
    expect(items.data.itemsByCreatedAt.items).toHaveLength(1);
    items = await itemsByCreatedAt(hashKey, { beginsWith: sortKey });
    expect(items.data.itemsByCreatedAt.items).toHaveLength(1);
    items = await itemsByCreatedAt(hashKey, { eq: sortKey });
    expect(items.data.itemsByCreatedAt.items).toHaveLength(1);
    items = await itemsByCreatedAt(hashKey, { between: [sortKey, sortKey] });
    expect(items.data.itemsByCreatedAt.items).toHaveLength(1);
    items = await itemsByCreatedAt(hashKey, { gt: sortKey });
    expect(items.data.itemsByCreatedAt.items).toHaveLength(0);
    items = await itemsByCreatedAt(hashKey, { ge: sortKey });
    expect(items.data.itemsByCreatedAt.items).toHaveLength(1);
    items = await itemsByCreatedAt(hashKey, { lt: sortKey });
    expect(items.data.itemsByCreatedAt.items).toHaveLength(0);
    items = await itemsByCreatedAt(hashKey, { le: sortKey });
    expect(items.data.itemsByCreatedAt.items).toHaveLength(1);
    items = await itemsByCreatedAt(undefined, { le: sortKey });
    expect(items.data).toBeNull();
    expect(items.errors.length).toBeGreaterThan(0);
    await deleteItem('order1', sortKey, '2018-01-01T00:01:01.000Z');
    await deleteItem('order2', sortKey, hashKey);
    await deleteItem('order3', sortKey, '2018-09-01T00:01:01.000Z');
  });

  test('Test update mutation validation with three part secondary key.', async () => {
    const createResponseMissingLastSortKey = await createShippingUpdate({ orderId: '1sttry', itemId: 'item1', name: '42' });
    expect(createResponseMissingLastSortKey.data.createShippingUpdate).toBeNull();
    expect(createResponseMissingLastSortKey.errors).toHaveLength(1);

    const createResponseMissingFirstSortKey = await createShippingUpdate({ orderId: '2ndtry', status: 'PENDING', name: '43?' });
    expect(createResponseMissingFirstSortKey.data.createShippingUpdate).toBeNull();
    expect(createResponseMissingFirstSortKey.errors).toHaveLength(1);

    await createShippingUpdate({ orderId: 'order1', itemId: 'item1', status: 'PENDING', name: 'name1' });
    const items = await getShippingUpdates('order1');
    expect(items.data.shippingUpdates.items).toHaveLength(1);
    const item = items.data.shippingUpdates.items[0];
    expect(item.name).toEqual('name1');

    const itemsWithFilter = await getShippingUpdatesWithNameFilter('order1', 'name1');
    expect(itemsWithFilter.data.shippingUpdates.items).toHaveLength(1);
    const itemWithFilter = itemsWithFilter.data.shippingUpdates.items[0];
    expect(itemWithFilter.name).toEqual('name1');

    const itemsWithUnknownFilter = await getShippingUpdatesWithNameFilter('order1', 'unknownname');
    expect(itemsWithUnknownFilter.data.shippingUpdates.items).toHaveLength(0);

    const updateResponseMissingLastSortKey = await updateShippingUpdate({
      id: item.id,
      orderId: 'order1',
      itemId: 'item1',
      name: 'name2',
    });
    expect(updateResponseMissingLastSortKey.data.updateShippingUpdate).toBeNull();
    expect(updateResponseMissingLastSortKey.errors).toHaveLength(1);
    const updateResponseMissingFirstSortKey = await updateShippingUpdate({
      id: item.id,
      orderId: 'order1',
      status: 'PENDING',
      name: 'name3',
    });
    expect(updateResponseMissingFirstSortKey.data.updateShippingUpdate).toBeNull();
    expect(updateResponseMissingFirstSortKey.errors).toHaveLength(1);
    const updateResponseMissingAllSortKeys = await updateShippingUpdate({
      id: item.id,
      orderId: 'order1',
      name: 'testing',
    });
    expect(updateResponseMissingAllSortKeys.data.updateShippingUpdate.name).toEqual('testing');
    const updateResponseMissingNoKeys = await updateShippingUpdate({
      id: item.id,
      orderId: 'order1',
      itemId: 'item1',
      status: 'PENDING',
      name: 'testing2',
    });
    expect(updateResponseMissingNoKeys.data.updateShippingUpdate.name).toEqual('testing2');
  });

  test('Test Customer Create with list member and secondary key', async () => {
    await createCustomer('customer1@email.com', ['thing1', 'thing2'], 'customerusr1');
    const getCustomer1 = await getCustomer('customer1@email.com');
    expect(getCustomer1.data.getCustomer.addresslist).toEqual(['thing1', 'thing2']);
  });

  test('Test cannot overwrite customer record with custom primary key', async () => {
    await createCustomer('customer42@email.com', ['thing1', 'thing2'], 'customerusr42');
    const response = await createCustomer('customer42@email.com', ['thing2'], 'customerusr43');
    expect(response.errors).toBeDefined();
    expect(response.errors[0]).toEqual(
      expect.objectContaining({
        message: 'The conditional request failed',
        errorType: 'DynamoDB:ConditionalCheckFailedException',
      }),
    );
  });

  test('Test Customer Mutation with list member', async () => {
    await updateCustomer('customer1@email.com', ['thing3', 'thing4'], 'new_customerusr1');
    const getCustomer1 = await getCustomer('customer1@email.com');
    expect(getCustomer1.data.getCustomer.addresslist).toEqual(['thing3', 'thing4']);
  });
});

async function createCustomer(email: string, addresslist: string[], username: string) {
  const result = await GRAPHQL_CLIENT.query(
    `mutation CreateCustomer($input: CreateCustomerInput!) {
        createCustomer(input: $input) {
            email
            addresslist
            username
        }
    }`,
    {
      input: { email, addresslist, username },
    },
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function updateCustomer(email: string, addresslist: string[], username: string) {
  const result = await GRAPHQL_CLIENT.query(
    `mutation UpdateCustomer($input: UpdateCustomerInput!) {
        updateCustomer(input: $input) {
            email
            addresslist
            username
        }
    }`,
    {
      input: { email, addresslist, username },
    },
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function getCustomer(email: string) {
  const result = await GRAPHQL_CLIENT.query(
    `query GetCustomer($email: String!) {
        getCustomer(email: $email) {
            email
            addresslist
            username
        }
    }`,
    {
      email,
    },
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function createOrder(customerEmail: string, orderId: string) {
  const result = await GRAPHQL_CLIENT.query(
    `mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
            customerEmail
            orderId
            createdAt
        }
    }`,
    {
      input: { customerEmail, orderId, createdAt: new Date().toISOString() },
    },
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function updateOrder(customerEmail: string, createdAt: string, orderId: string) {
  const result = await GRAPHQL_CLIENT.query(
    `mutation UpdateOrder($input: UpdateOrderInput!) {
        updateOrder(input: $input) {
            customerEmail
            orderId
            createdAt
        }
    }`,
    {
      input: { customerEmail, orderId, createdAt },
    },
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function deleteOrder(customerEmail: string, createdAt: string) {
  const result = await GRAPHQL_CLIENT.query(
    `mutation DeleteOrder($input: DeleteOrderInput!) {
        deleteOrder(input: $input) {
            customerEmail
            orderId
            createdAt
        }
    }`,
    {
      input: { customerEmail, createdAt },
    },
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function getOrder(customerEmail: string, createdAt: string) {
  const result = await GRAPHQL_CLIENT.query(
    `query GetOrder($customerEmail: String!, $createdAt: String!) {
        getOrder(customerEmail: $customerEmail, createdAt: $createdAt) {
            customerEmail
            orderId
            createdAt
        }
    }`,
    { customerEmail, createdAt },
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function createItem(orderId: string, status: string, name: string, createdAt: string = new Date().toISOString()) {
  const input = { status, orderId, name, createdAt };
  const result = await GRAPHQL_CLIENT.query(
    `mutation CreateItem($input: CreateItemInput!) {
        createItem(input: $input) {
            orderId
            status
            createdAt
            name
        }
    }`,
    {
      input,
    },
  );
  logDebug(`Running create: ${JSON.stringify(input)}`);
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function updateItem(orderId: string, status: string, createdAt: string, name: string) {
  const input = { status, orderId, createdAt, name };
  const result = await GRAPHQL_CLIENT.query(
    `mutation UpdateItem($input: UpdateItemInput!) {
        updateItem(input: $input) {
            orderId
            status
            createdAt
            name
        }
    }`,
    {
      input,
    },
  );
  logDebug(`Running create: ${JSON.stringify(input)}`);
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function deleteItem(orderId: string, status: string, createdAt: string) {
  const input = { orderId, status, createdAt };
  const result = await GRAPHQL_CLIENT.query(
    `mutation DeleteItem($input: DeleteItemInput!) {
        deleteItem(input: $input) {
            orderId
            status
            createdAt
            name
        }
    }`,
    {
      input,
    },
  );
  logDebug(`Running delete: ${JSON.stringify(input)}`);
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function getItem(orderId: string, status: string, createdAt: string) {
  const result = await GRAPHQL_CLIENT.query(
    `query GetItem($orderId: ID!, $status: Status!, $createdAt: AWSDateTime!) {
        getItem(orderId: $orderId, status: $status, createdAt: $createdAt) {
            orderId
            status
            createdAt
            name
        }
    }`,
    { orderId, status, createdAt },
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

interface StringKeyConditionInput {
  eq?: string;
  gt?: string;
  ge?: string;
  lt?: string;
  le?: string;
  between?: string[];
  beginsWith?: string;
}

interface ItemCompositeKeyConditionInput {
  eq?: ItemCompositeKeyInput;
  gt?: ItemCompositeKeyInput;
  ge?: ItemCompositeKeyInput;
  lt?: ItemCompositeKeyInput;
  le?: ItemCompositeKeyInput;
  between?: ItemCompositeKeyInput[];
  beginsWith?: ItemCompositeKeyInput;
}

interface ItemCompositeKeyInput {
  status?: string;
  createdAt?: string;
}

async function listItem(orderId?: string, statusCreatedAt?: ItemCompositeKeyConditionInput, limit?: number, nextToken?: string) {
  const result = await GRAPHQL_CLIENT.query(
    `query ListItems($orderId: ID, $statusCreatedAt: ModelItemPrimaryCompositeKeyConditionInput, $limit: Int, $nextToken: String) {
        listItems(orderId: $orderId, statusCreatedAt: $statusCreatedAt, limit: $limit, nextToken: $nextToken) {
            items {
                orderId
                status
                createdAt
                name
            }
            nextToken
        }
    }`,
    { orderId, statusCreatedAt, limit, nextToken },
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function itemsByStatus(status: string, createdAt?: StringKeyConditionInput, limit?: number, nextToken?: string) {
  const result = await GRAPHQL_CLIENT.query(
    `query ListByStatus($status: Status!, $createdAt: ModelStringKeyConditionInput, $limit: Int, $nextToken: String) {
        itemsByStatus(status: $status, createdAt: $createdAt, limit: $limit, nextToken: $nextToken) {
            items {
                orderId
                status
                createdAt
                name
            }
            nextToken
        }
    }`,
    { status, createdAt, limit, nextToken },
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function itemsByCreatedAt(createdAt: string, status?: StringKeyConditionInput, limit?: number, nextToken?: string) {
  const result = await GRAPHQL_CLIENT.query(
    `query ListByCreatedAt($createdAt: AWSDateTime!, $status: ModelStringKeyConditionInput, $limit: Int, $nextToken: String) {
        itemsByCreatedAt(createdAt: $createdAt, status: $status, limit: $limit, nextToken: $nextToken) {
            items {
                orderId
                status
                createdAt
                name
            }
            nextToken
        }
    }`,
    { createdAt, status, limit, nextToken },
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

interface CreateShippingInput {
  id?: string;
  orderId?: string;
  status?: string;
  itemId?: string;
  name?: string;
}

async function createShippingUpdate(input: CreateShippingInput) {
  const result = await GRAPHQL_CLIENT.query(
    `mutation CreateShippingUpdate($input: CreateShippingUpdateInput!) {
        createShippingUpdate(input: $input) {
            orderId
            status
            itemId
            name
            id
        }
    }`,
    {
      input,
    },
  );
  logDebug(`Running create: ${JSON.stringify(input)}`);
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

interface UpdateShippingInput {
  id: string;
  orderId?: string;
  status?: string;
  itemId?: string;
  name?: string;
}

async function updateShippingUpdate(input: UpdateShippingInput) {
  const result = await GRAPHQL_CLIENT.query(
    `mutation UpdateShippingUpdate($input: UpdateShippingUpdateInput!) {
        updateShippingUpdate(input: $input) {
            orderId
            status
            itemId
            name
            id
        }
    }`,
    {
      input,
    },
  );
  logDebug(`Running update: ${JSON.stringify(input)}`);
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function getShippingUpdates(orderId: string) {
  const result = await GRAPHQL_CLIENT.query(
    `query GetShippingUpdates($orderId: ID!) {
        shippingUpdates(orderId: $orderId) {
            items {
                id
                orderId
                status
                itemId
                name
            }
            nextToken
        }
    }`,
    { orderId },
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function getShippingUpdatesWithNameFilter(orderId: string, name: string) {
  const result = await GRAPHQL_CLIENT.query(
    `query GetShippingUpdates($orderId: ID!, $name: String) {
        shippingUpdates(orderId: $orderId, filter: { name: { eq: $name }}) {
            items {
                id
                orderId
                status
                itemId
                name
            }
            nextToken
        }
    }`,
    { orderId, name },
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}
