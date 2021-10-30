import { DefaultTransformHost } from '../transform-host';
import { GraphQLApi, TransformerAPIProps } from '../graphql-api';
import { App } from '@aws-cdk/core';
import { InlineTemplate } from '../cdk-compat/template-asset';
import { TransformerRootStack } from '../cdk-compat/root-stack';

// jest.mock('../graphql-api');

// const GraphqlApi_mock = GraphQLApi as jest.MockedClass<typeof GraphQLApi>;

describe('addResolver', () => {
  const app = new App();
  const stack = new TransformerRootStack(app, 'test-root-stack');
  const transformHost = new DefaultTransformHost({ api: new GraphQLApi(stack, 'testId', { name: 'testApiName' }) });

  it('generates resolver name with hash for non-alphanumeric type names', () => {
    const cfnResolver = transformHost.addResolver(
      'test_type',
      'testField',
      new InlineTemplate('testTemplate'),
      new InlineTemplate('testTemplate'),
      undefined,
      ['testPipelineConfig'],
      stack,
    );
    expect(cfnResolver.logicalId).toMatch('testtype4c79TestFieldResolver.LogicalID'); // have to use match instead of equals because the logicalId is a CDK token that has some non-deterministic stuff in it
  });

  it('generates resolver name with hash for non-alphanumeric field names', () => {
    const cfnResolver = transformHost.addResolver(
      'testType',
      'test_field',
      new InlineTemplate('testTemplate'),
      new InlineTemplate('testTemplate'),
      undefined,
      ['testPipelineConfig'],
      stack,
    );
    expect(cfnResolver.logicalId).toMatch('testTypeTestfield6a0fResolver.LogicalID'); // have to use match instead of equals because the logicalId is a CDK token that has some non-deterministic stuff in it
  });
});
