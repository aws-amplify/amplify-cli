import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { ConflictHandlerType, GraphQLTransform, SyncConfig } from '@aws-amplify/graphql-transformer-core';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import { SearchableModelTransformer } from '@aws-amplify/graphql-searchable-transformer';
import { AccessControlMatrix } from '../accesscontrol';
import { AuthTransformer } from '../graphql-auth-transformer';
import { MODEL_OPERATIONS } from '../utils';

test('invalid read list operation combination', () => {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const invalidSchema = `
    type Test @model @auth(rules: [{ allow: public, operations: [ read, list, create ]}]) {
      id: ID!
      name: String
    }`;
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer()],
  });
  expect(() => transformer.transform(invalidSchema)).toThrowError(
    '\'list\' operations are specified in addition to \'read\'. Either remove \'read\' to limit access only to \'list\' or only keep \'read\' to grant all get,list,search,sync,listen access.',
  );
});

test('invalid read get operation combination', () => {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const invalidSchema = `
    type Test @model @auth(rules: [{ allow: public, operations: [ read, get, create ]}]) {
      id: ID!
      name: String
    }`;
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer()],
  });
  expect(() => transformer.transform(invalidSchema)).toThrowError(
    '\'get\' operations are specified in addition to \'read\'. Either remove \'read\' to limit access only to \'get\' or only keep \'read\' to grant all get,list,search,sync,listen access.',
  );
});

test('read access control', () => {
  /*
  given the following schema
  type TestList @model @auth(rules: [{ allow: public, operations: [ read, create ]}]) {
    id: ID!
    name: String
  }
  */

  const ownerRole = 'userPools:owner:id';
  const typeFields = ['id', 'name'];

  const acm = new AccessControlMatrix({
    name: 'TestList',
    resources: typeFields,
    operations: MODEL_OPERATIONS,
  });

  acm.setRole({
    role: ownerRole,
    operations: ['get', 'list'],
  });

  typeFields.forEach(field => {
    expect(acm.isAllowed(ownerRole, field, 'list')).toBe(true);
    expect(acm.isAllowed(ownerRole, field, 'get')).toBe(true);
  });
});

test('list access control', () => {
  /*
  given the following schema
  type TestList @model @auth(rules: [{ allow: public, operations: [ list, create ]}]) {
    id: ID!
    name: String
  }
  */

  const ownerRole = 'userPools:owner:id';
  const typeFields = ['id', 'name'];

  const acm = new AccessControlMatrix({
    name: 'TestList',
    resources: typeFields,
    operations: MODEL_OPERATIONS,
  });

  acm.setRole({
    role: ownerRole,
    operations: ['list'],
  });

  typeFields.forEach(field => {
    expect(acm.isAllowed(ownerRole, field, 'list')).toBe(true);
    expect(acm.isAllowed(ownerRole, field, 'get')).toBe(false);
  });
});

test('get access control', () => {
  /*
  given the following schema
  type TestList @model @auth(rules: [{ allow: public, operations: [ get, create ]}]) {
    id: ID!
    name: String
  }
  */

  const ownerRole = 'userPools:owner:id';
  const typeFields = ['id', 'name'];

  const acm = new AccessControlMatrix({
    name: 'TestList',
    resources: typeFields,
    operations: MODEL_OPERATIONS,
  });

  acm.setRole({
    role: ownerRole,
    operations: ['get'],
  });

  typeFields.forEach(field => {
    expect(acm.isAllowed(ownerRole, field, 'list')).toBe(false);
    expect(acm.isAllowed(ownerRole, field, 'get')).toBe(true);
  });
});

test('read get list auth operations', () => {
  const config: SyncConfig = {
    ConflictDetection: 'VERSION',
    ConflictHandler: ConflictHandlerType.AUTOMERGE,
  };

  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'API_KEY',
    },
    additionalAuthenticationProviders: [],
  };
  const validSchema = `
    type TestSubscription @model @searchable @auth(rules: [{ allow: public, operations: [ listen ]}]) {
      id: ID!
      name: String
    }
    type TestSearch @model @searchable @auth(rules: [{ allow: public, operations: [ search ]}]) {
      id: ID!
      name: String
    }
    type TestSync @model @searchable @auth(rules: [{ allow: public, operations: [ sync ]}]) {
      id: ID!
      name: String
    }
    type TestList @model @searchable @auth(rules: [{ allow: public, operations: [ list ]}]) {
      id: ID!
      name: String
    }
    type TestGet @model @searchable @auth(rules: [{ allow: public, operations: [ get ]}]) {
      id: ID!
      name: String
    }
    type TestRead @model @searchable @auth(rules: [{ allow: public, operations: [ read ]}]) {
      id: ID!
      name: String
    }
  `;

  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new SearchableModelTransformer(), new AuthTransformer()],
    resolverConfig: {
      project: config,
    },
  });

  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  // listen
  expect(out.resolvers['Query.getTestSubscription.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Query.listTestSubscriptions.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Subscription.onCreateTestSubscription.auth.1.req.vtl']).toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Subscription.onDeleteTestSubscription.auth.1.req.vtl']).toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Subscription.onUpdateTestSubscription.auth.1.req.vtl']).toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Query.searchTestSubscriptions.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Query.syncTestSubscriptions.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');

  // search
  expect(out.resolvers['Query.getTestSearch.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Query.listTestSearches.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Subscription.onCreateTestSearch.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Subscription.onDeleteTestSearch.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Subscription.onUpdateTestSearch.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Query.searchTestSearches.auth.1.req.vtl']).toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Query.syncTestSearches.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');

  // sync
  expect(out.resolvers['Query.getTestSync.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Query.listTestSyncs.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Subscription.onCreateTestSync.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Subscription.onDeleteTestSync.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Subscription.onUpdateTestSync.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Query.searchTestSyncs.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Query.syncTestSyncs.auth.1.req.vtl']).toContain('#set( $isAuthorized = true )');

  // get
  expect(out.resolvers['Query.getTestList.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Query.listTestLists.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Subscription.onCreateTestList.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Subscription.onDeleteTestList.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Subscription.onUpdateTestList.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Query.getTestList.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Query.listTestLists.auth.1.req.vtl']).toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Subscription.onCreateTestList.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Subscription.onDeleteTestList.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Subscription.onUpdateTestList.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');

  // list
  expect(out.resolvers['Query.getTestGet.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Query.listTestGets.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Subscription.onCreateTestGet.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Subscription.onDeleteTestGet.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Subscription.onUpdateTestGet.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Query.getTestGet.auth.1.req.vtl']).toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Query.listTestGets.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Subscription.onCreateTestGet.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Subscription.onDeleteTestGet.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Subscription.onUpdateTestGet.auth.1.req.vtl']).not.toContain('#set( $isAuthorized = true )');

  // read
  expect(out.resolvers['Query.getTestRead.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Query.listTestReads.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Subscription.onCreateTestRead.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Subscription.onDeleteTestRead.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Subscription.onUpdateTestRead.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Query.getTestRead.auth.1.req.vtl']).toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Query.listTestReads.auth.1.req.vtl']).toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Subscription.onCreateTestRead.auth.1.req.vtl']).toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Subscription.onDeleteTestRead.auth.1.req.vtl']).toContain('#set( $isAuthorized = true )');
  expect(out.resolvers['Subscription.onUpdateTestRead.auth.1.req.vtl']).toContain('#set( $isAuthorized = true )');
});
