'use strict';
import { anything, countResources, expect as cdkExpect, haveResource } from '@aws-cdk/assert';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { parse } from 'graphql';
import { FunctionTransformer } from '..';
import * as path from 'path';
test('it ovderrides the expected resources', () => {
  const validSchema = `
    type Query {
      echo(msg: String): String @function(name: "echofunction-\${env}") @function(name: "otherfunction")
    }
      `;

  const transformer = new GraphQLTransform({
    transformers: [new FunctionTransformer()],
    overrideConfig: {
      overrideDir: path.join(__dirname, 'overrides'),
      overrideFlag: true,
      resourceName: 'myResource',
    },
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  parse(out.schema);
  expect(out.stacks).toBeDefined();
  const stack = out.stacks.FunctionDirectiveStack;
  expect(stack).toBeDefined();
  expect(stack).toMatchSnapshot();
});
