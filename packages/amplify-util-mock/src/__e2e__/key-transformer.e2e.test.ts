import { ResourceConstants } from 'graphql-transformer-common';
import GraphQLTransform from 'graphql-transformer-core';
import ModelTransformer from 'graphql-dynamodb-transformer';
import KeyTransformer from 'graphql-key-transformer';

import { GraphQLClient } from './utils/graphql-client';
import { deploy, launchDDBLocal, terminateDDB, logDebug } from './utils/index';

jest.setTimeout(2000000);

let GRAPHQL_ENDPOINT = undefined;
let GRAPHQL_CLIENT = undefined;
let ddbEmulator = null;
let dbPath = null;
let server;

beforeAll(async () => {
  const validSchema = `
    type Order @model @key(fields: ["customerEmail", "createdAt"]) {
        customerEmail: String!
        createdAt: String!
        orderId: ID!
    }
    type Customer @model @key(fields: ["email"]) {
        email: String!
        addresslist:  [String]
        username: String
    }
    type Item @model
        @key(fields: ["orderId", "status", "createdAt"])
        @key(name: "ByStatus", fields: ["status", "createdAt"], queryField: "itemsByStatus")
        @key(name: "ByCreatedAt", fields: ["createdAt", "status"], queryField: "itemsByCreatedAt")
    {
        orderId: ID!
        status: Status!
        createdAt: AWSDateTime!
        name: String!
    }
    enum Status {
        DELIVERED IN_TRANSIT PENDING UNKNOWN
    }
    type ShippingUpdate @model
        @key(name: "ByOrderItemStatus", fields: ["orderId", "itemId", "status"], queryField: "shippingUpdates")
    {
        id: ID!
        orderId: ID
        itemId: ID
        status: Status
        name: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new KeyTransformer()],
  });
  const out = transformer.transform(validSchema);
  let ddbClient;
  ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await launchDDBLocal());
  const result = await deploy(out, ddbClient);
  server = result.simulator;

  GRAPHQL_ENDPOINT = server.url + '/graphql';
  console.log(`Using graphql url: ${GRAPHQL_ENDPOINT}`);

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
  await createShippingUpdate('order1', 'item1', 'PENDING', 'name1');
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
  const createCustomer1 = await createCustomer(
    'customer1@email.com',
    ['thing1', 'thing2'],
    'customerusr1'
  );
  const getCustomer1 = await getCustomer('customer1@email.com');
  expect(getCustomer1.data.getCustomer.addresslist).toEqual(['thing1', 'thing2']);
  // const items = await onCreateCustomer
});

test('Test Customer Mutation with list member', async () => {
  const updateCustomer1 = await updateCustomer(
    'customer1@email.com',
    ['thing3', 'thing4'],
    'new_customerusr1'
  );
  const getCustomer1 = await getCustomer('customer1@email.com');
  expect(getCustomer1.data.getCustomer.addresslist).toEqual(['thing3', 'thing4']);
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    { customerEmail, createdAt }
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function createItem(
  orderId: string,
  status: string,
  name: string,
  createdAt: string = new Date().toISOString()
) {
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
    }
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
    }
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
    }
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
    { orderId, status, createdAt }
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
async function listItem(
  orderId?: string,
  statusCreatedAt?: ItemCompositeKeyConditionInput,
  limit?: number,
  nextToken?: string
) {
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
    { orderId, statusCreatedAt, limit, nextToken }
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function itemsByStatus(
  status: string,
  createdAt?: StringKeyConditionInput,
  limit?: number,
  nextToken?: string
) {
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
    { status, createdAt, limit, nextToken }
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function itemsByCreatedAt(
  createdAt: string,
  status?: StringKeyConditionInput,
  limit?: number,
  nextToken?: string
) {
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
    { createdAt, status, limit, nextToken }
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function createShippingUpdate(
  orderId: string,
  itemId: string,
  status: string,
  name?: string
) {
  const input = { status, orderId, itemId, name };
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
    }
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
  // const input = { id, status, orderId, itemId, name };
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
    }
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
    { orderId }
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
    { orderId, name }
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}
