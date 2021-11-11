import { mergeUserConfigWithTransformOutput } from '../../graphql-transformer/utils';
import { TransformerProjectConfig, DeploymentResources } from '@aws-amplify/graphql-transformer-core';

describe('graphql transformer utils', () => {
  let userConfig: TransformerProjectConfig;
  let transformerOutput: DeploymentResources;

  beforeAll(() => {
    transformerOutput = {
      resolvers: {
        'Query.listTodos.req.vtl': '## [Start] List Request. **\n' + '#set( $limit = $util.defaultIfNull($context.args.limit, 100) )\n',
      },
      pipelineFunctions: {},
      functions: {},
      schema: '',
      stackMapping: {},
      stacks: {},
      rootStack: {
        Parameters: {},
        Resources: {},
      },
    } as DeploymentResources;
  });

  describe('mergeUserConfigWithTransformOutput', () => {
    describe('has user created functions', () => {
      beforeAll(() => {
        userConfig = {
          schema: '',
          functions: {
            userFn: 'userFn()',
          },
          pipelineFunctions: {},
          resolvers: {},
          stacks: {},
          config: { Version: 5, ElasticsearchWarning: true },
        } as TransformerProjectConfig;
      });

      it('merges function with transform output functions', () => {
        const { functions } = mergeUserConfigWithTransformOutput(userConfig, transformerOutput);

        expect(functions['userFn']).toEqual('userFn()');
      });
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

        expect(output.resolvers['Query.listTodos.req.vtl']).toEqual('$util.unauthorized\n');
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
        const { resolvers } = mergeUserConfigWithTransformOutput(userConfig, transformerOutput);

        expect(resolvers['Query.listTodos.req.vtl']).toEqual('$util.unauthorized\n');
      });
    });

    describe('has user created stacks', () => {
      beforeAll(() => {
        userConfig = {
          schema: '',
          functions: {},
          pipelineFunctions: {},
          resolvers: {},
          stacks: {
            'CustomResources.json': {
              Resources: {
                QueryCommentsForTodoResolver: {
                  Type: 'AWS::AppSync::Resolver',
                  Properties: {
                    ApiId: {
                      Ref: 'AppSyncApiId',
                    },
                    DataSourceName: 'CommentTable',
                    TypeName: 'Query',
                    FieldName: 'commentsForTodo',
                    RequestMappingTemplateS3Location: {
                      'Fn::Sub': [
                        's3://${S3DeploymentBucket}/${S3DeploymentRootKey}/pipelineFunctions/Query.commentsForTodo.req.vtl',
                        {
                          S3DeploymentBucket: {
                            Ref: 'S3DeploymentBucket',
                          },
                          S3DeploymentRootKey: {
                            Ref: 'S3DeploymentRootKey',
                          },
                        },
                      ],
                    },
                    ResponseMappingTemplateS3Location: {
                      'Fn::Sub': [
                        's3://${S3DeploymentBucket}/${S3DeploymentRootKey}/pipelineFunctions/Query.commentsForTodo.res.vtl',
                        {
                          S3DeploymentBucket: {
                            Ref: 'S3DeploymentBucket',
                          },
                          S3DeploymentRootKey: {
                            Ref: 'S3DeploymentRootKey',
                          },
                        },
                      ],
                    },
                  },
                },
              },
              Parameters: {
                AppSyncApiId: {
                  Type: 'String',
                  Description: 'The id of the AppSync API associated with this project.',
                },
                AppSyncApiName: {
                  Type: 'String',
                  Description: 'The name of the AppSync API',
                  Default: 'AppSyncSimpleTransform',
                },
                env: {
                  Type: 'String',
                  Description: 'The environment name. e.g. Dev, Test, or Production',
                  Default: 'NONE',
                },
                S3DeploymentBucket: {
                  Type: 'String',
                  Description: 'The S3 bucket containing all deployment assets for the project.',
                },
                S3DeploymentRootKey: {
                  Type: 'String',
                  Description: 'An S3 key relative to the S3DeploymentBucket that points to the root\n' + 'of the deployment directory.',
                },
              },
            },
          },
          config: { Version: 5, ElasticsearchWarning: true },
        } as unknown as TransformerProjectConfig;
      });

      it('merges custom pipeline function with transformer output', () => {
        const { stacks } = mergeUserConfigWithTransformOutput(userConfig, transformerOutput);

        expect(stacks).toEqual({
          'CustomResources.json': {
            Resources: {
              QueryCommentsForTodoResolver: {
                Type: 'AWS::AppSync::Resolver',
                Properties: {
                  ApiId: {
                    Ref: 'AppSyncApiId',
                  },
                  DataSourceName: 'CommentTable',
                  TypeName: 'Query',
                  FieldName: 'commentsForTodo',
                  RequestMappingTemplateS3Location: {
                    'Fn::Sub': [
                      's3://${S3DeploymentBucket}/${S3DeploymentRootKey}/pipelineFunctions/Query.commentsForTodo.req.vtl',
                      {
                        S3DeploymentBucket: {
                          Ref: 'S3DeploymentBucket',
                        },
                        S3DeploymentRootKey: {
                          Ref: 'S3DeploymentRootKey',
                        },
                      },
                    ],
                  },
                  ResponseMappingTemplateS3Location: {
                    'Fn::Sub': [
                      's3://${S3DeploymentBucket}/${S3DeploymentRootKey}/pipelineFunctions/Query.commentsForTodo.res.vtl',
                      {
                        S3DeploymentBucket: {
                          Ref: 'S3DeploymentBucket',
                        },
                        S3DeploymentRootKey: {
                          Ref: 'S3DeploymentRootKey',
                        },
                      },
                    ],
                  },
                },
              },
            },
            Parameters: {
              AppSyncApiId: {
                Type: 'String',
                Description: 'The id of the AppSync API associated with this project.',
              },
              AppSyncApiName: {
                Type: 'String',
                Description: 'The name of the AppSync API',
                Default: 'AppSyncSimpleTransform',
              },
              env: {
                Type: 'String',
                Description: 'The environment name. e.g. Dev, Test, or Production',
                Default: 'NONE',
              },
              S3DeploymentBucket: {
                Type: 'String',
                Description: 'The S3 bucket containing all deployment assets for the project.',
              },
              S3DeploymentRootKey: {
                Type: 'String',
                Description: 'An S3 key relative to the S3DeploymentBucket that points to the root\n' + 'of the deployment directory.',
              },
            },
          },
        });
      });
    });
  });
});
