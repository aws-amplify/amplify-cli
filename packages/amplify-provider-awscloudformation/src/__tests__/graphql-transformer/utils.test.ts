import { mergeUserConfigWithTransformOutput } from '../../graphql-transformer/utils';
import { TransformerProjectConfig, DeploymentResources } from '@aws-amplify/graphql-transformer-core';

describe('mergeUserConfigWithTransformOutput', () => {
  let userConfig;
  let transformerOutput;

  beforeAll(() => {
    transformerOutput = {
      resolvers: {},
      pipelineFunctions: {
        'Query.listTodos.req.vtl': '## [Start] List Request. **\n' + '#set( $limit = $util.defaultIfNull($context.args.limit, 100) )\n',
      },
      functions: {},
      schema: '',
      stackMapping: {},
      stacks: {},
      rootStack: null,
    } as DeploymentResources;
  });

  describe('has user-created resolvers', () => {
    beforeAll(() => {
      userConfig = {
        schema: '',
        functions: {},
        pipelineFunctions: {},
        resolvers: {
          'Query.listTodos.req.vtl': '$util.unauthorized\n',
        },
        stacks: {},
        config: { Version: 5, ElasticsearchWarning: true },
      } as TransformerProjectConfig;
    });

    it('merges the custom resolver with transformer output', () => {
      const output = mergeUserConfigWithTransformOutput(userConfig, transformerOutput);

      expect(output.pipelineFunctions['Query.listTodos.req.vtl']).toEqual('$util.unauthorized\n');
    });
  });

  describe('has user created pipeline function', () => {
    beforeAll(() => {
      userConfig = {
        schema: '',
        functions: {},
        pipelineFunctions: {
          'Query.listTodos.req.vtl': '$util.unauthorized\n',
        },
        resolvers: {},
        stacks: {},
        config: { Version: 5, ElasticsearchWarning: true },
      } as TransformerProjectConfig;
    });

    it('merges custom pipeline function with transformer output', () => {
      const output = mergeUserConfigWithTransformOutput(userConfig, transformerOutput);

      expect(output.pipelineFunctions['Query.listTodos.req.vtl']).toEqual('$util.unauthorized\n');
    });
  });
});
