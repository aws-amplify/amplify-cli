import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { ModelAuthTransformer } from '../ModelAuthTransformer';
import { GraphQLTransform } from 'graphql-transformer-core';

test('Test "and" parameter forces all rules to pass for read', () => {
  const validSchema = `
    type Comment @model @auth(rules: [
        {allow: groups, groups: ["Dev"], operations: [read]},
        {allow: groups, groups: ["Admin"], operations: [read], and: "testing"},
        {allow: owner, operations: [read], and: "testing"},
        {allow: groups, groupsField: "groupField", operations: [read], and: "testing"}
    ]) {
        id: ID!
        owner: ID!
        groupField: [String]!
        text: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'AMAZON_COGNITO_USER_POOLS',
          },
          additionalAuthenticationProviders: [],
        },
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.resolvers['Query.getComment.res.vtl']).toContain('#set( $isStaticGroupAuthorized = true )');
  expect(out.resolvers['Query.getComment.res.vtl']).toContain('$util.defaultIfNull($compoundAuthRuleCounts.testing, 0) == 3');
  expect(out.resolvers['Query.listComments.res.vtl']).toContain('$util.defaultIfNull($staticCompoundAuthRuleCounts.testing, 0) == 3');
  expect(out.resolvers['Query.getComment.res.vtl']).toMatchSnapshot();
  expect(out.resolvers['Query.listComments.res.vtl']).toMatchSnapshot();
});

test('Test "create", "update", "delete" auth operations with "and" parameter forces all rules to pass', () => {
  const validSchema = `
    type Post @model @auth(rules: [
        {allow: groups, groups: ["Admin"], operations: [read, create, update, delete], and: "testing"},
        {allow: groups, groupsField: "groupField", operations: [read, create, update, delete], and: "testing"},
        {allow: owner, operations: [create, update, delete], and: "testing2"},
        {allow: groups, groups: ["Dev"], operations: [create, update, delete], and: "testing2"}
    ]) {
        id: ID!
        title: String!
        groupField: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'AMAZON_COGNITO_USER_POOLS',
          },
          additionalAuthenticationProviders: [],
        },
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.resolvers['Query.getPost.res.vtl']).toContain('$util.defaultIfNull($compoundAuthRuleCounts.testing, 0) == 2');

  expect(out.resolvers['Query.getPost.res.vtl']).toMatchSnapshot();
  expect(out.resolvers['Query.listPosts.res.vtl']).toContain('$util.defaultIfNull($staticCompoundAuthRuleCounts.testing, 0) == 2');
  expect(out.resolvers['Query.listPosts.res.vtl']).toMatchSnapshot();

  expect(out.resolvers['Mutation.createPost.req.vtl']).toContain('$util.defaultIfNull($compoundAuthRuleCounts.testing, 0) == 2');
  expect(out.resolvers['Mutation.createPost.req.vtl']).toContain('$util.defaultIfNull($compoundAuthRuleCounts.testing2, 0) == 2');

  expect(out.resolvers['Mutation.createPost.req.vtl']).toMatchSnapshot();

  expect(out.resolvers['Mutation.updatePost.req.vtl']).toContain('#set( $innerCompoundAuth = "$innerCompoundAuth AND" )');
  expect(out.resolvers['Mutation.updatePost.req.vtl'].replace(/ +?/g, '')).toContain(
    '#if($compoundAuthRuleCounts.testing2==1)\n' + '$util.qr($compoundAuthExpressions.testing2.add("#owner0=:identity0"))\n' + '#end'
  );
  expect(out.resolvers['Mutation.updatePost.req.vtl'].replace(/ +?/g, '')).toContain(
    '#if($compoundAuthRuleCounts.testing==1)\n' +
      '$util.qr($groupCompoundAuthExpressionValues.add("contains(#groupsAttribute0,:group0$foreach.count)"))\n' +
      '#end'
  );

  expect(out.resolvers['Mutation.updatePost.req.vtl']).toMatchSnapshot();

  expect(out.resolvers['Mutation.deletePost.req.vtl'].replace(/ +?/g, '')).toContain(
    '#if($compoundAuthRuleCounts.testing2==1)\n' + '$util.qr($compoundAuthExpressions.testing2.add("#owner0=:identity0"))\n' + '#end'
  );
  expect(out.resolvers['Mutation.deletePost.req.vtl'].replace(/ +?/g, '')).toContain(
    '#if($compoundAuthRuleCounts.testing==1)\n' +
      '$util.qr($groupCompoundAuthExpressionValues.add("contains(#groupsAttribute0,:group0$foreach.count)"))\n' +
      '#end'
  );

  expect(out.resolvers['Mutation.deletePost.req.vtl']).toMatchSnapshot();
});

test('Test "update" auth operations with "and" parameter on fields prevents security bypass', () => {
  const validSchema = `
    type Post @model @auth(rules: [{allow: groups, groups: ["Admin"], operations: [create, read]}, {allow: groups, groups: ["Nobody"]}]) {
        id: ID!
        unprotected: String!
        protectedByStaticGroup: String @auth(rules: [{allow: groups, groups: ["Admin"], operations: [read, update]}])
        protectedByDynamocGroup: String @auth(rules: [{allow: groups, groupsField: "groupField", operations: [read, update]}])
        protectedByOwner: String @auth(rules: [{allow: owner, ownerField: "id", operations: [read, update]}])
        protectedByB: String @auth(rules: [{allow: owner, ownerField: "id", operations: [read, update], and: "bRule"}])
        protectedByA: String @auth(rules: [{allow: owner, ownerField: "id", operations: [read, update], and: "aRule"}])
        protectedByC: String @auth(rules: [{allow: groups, groups: ["Admin"], operations: [read, update], and: "cRule"}])
        groupField: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'AMAZON_COGNITO_USER_POOLS',
          },
          additionalAuthenticationProviders: [],
        },
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.resolvers['Mutation.updatePost.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.getPost.res.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.listPosts.res.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.createPost.res.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.deletePost.res.vtl']).toMatchSnapshot();
});
