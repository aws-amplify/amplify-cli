'use strict';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { parse } from 'graphql';
import { HttpTransformer } from '..';
import path from 'path';
test('it generates the overrided resources', () => {
  const validSchema = /* GraphQL */ `
    type Comment {
      id: ID!
      content: String @http(method: POST, url: "http://www.api.com/ping")
      content2: String @http(method: PUT, url: "http://www.api.com/ping")
      more: String @http(url: "http://api.com/ping/me/2")
      evenMore: String @http(method: DELETE, url: "http://www.google.com/query/id")
      stillMore: String @http(method: PATCH, url: "https://www.api.com/ping/id")
    }
  `;
  const transformer = new GraphQLTransform({
    transformers: [new HttpTransformer()],
    overrideConfig: {
      overrideDir: path.join(__dirname, 'overrides'),
      overrideFlag: true,
      resourceName: 'myResource',
    },
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks).toBeDefined();
  parse(out.schema);
  const stack = out.stacks.HttpStack;
  expect(stack).toMatchSnapshot();
});
